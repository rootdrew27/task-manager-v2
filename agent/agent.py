from typing import Union
from livekit.agents.llm.llm import ChatChunk
from livekit.agents.llm.chat_context import FunctionCallOutput
from typing import AsyncGenerator
from livekit.agents.job import get_job_context
import time
import json
from typing import Any, Optional

from dotenv import load_dotenv

from pydantic import FutureDate

from custom_types import TaskName, TaskDescription
import db as mongodb

from livekit import api
from livekit.protocol.room import UpdateRoomMetadataRequest

from livekit import agents
from livekit.agents import llm
from livekit.agents.voice import ModelSettings
from livekit.agents import (
    AgentSession,
    Agent,
    RoomInputOptions,
    RoomOutputOptions,
    function_tool,
    FunctionTool,
    RunContext,
)
from livekit.agents.llm import RawFunctionTool
from livekit.plugins import (
    openai,
    deepgram,
    silero,
)

from prompts import TASK_ASSISTANT_INSTRUCTIONS_TEMPLATE

load_dotenv(".env.local", verbose=True)

TOOL_NAMES = ["create_task", "edit_task", "delete_task", "invalid_request"]

TOOL_INSTRUCTIONS = (
    "When the user requests to create, add, or make a new task you will use the 'create_task' function. "
    "When the user requests to edit, modify, or change a task in any way, you will use the 'edit_task' function. "
    "When the user requests to delete, remove, or clear a task you will use the 'delete_task' function."
    "When the user requests anything unrelated to managing their tasks you will use the 'invalid_request' function."
)

task_assistant_instructions = TASK_ASSISTANT_INSTRUCTIONS_TEMPLATE.format(
    tools=", ".join(TOOL_NAMES), tool_instructions=TOOL_INSTRUCTIONS, final_notes=""
)


async def stream_taskassistant_text(
    llm_response: AsyncGenerator[ChatChunk | str, None],
)-> str:
    room = get_job_context().room
    print(f"Remotes: {room.remote_participants}")
    print(f"Local: {room.local_participant}")
    writer = await room.local_participant.stream_text(
        topic="task-assistant--text",
    )

    text = ""
    async for chunk in llm_response:
        print(f"Chunk: {chunk}")
        if isinstance(chunk, ChatChunk):
            if chunk.delta is not None and chunk.delta.role == "assistant":
                text_chunk = chunk.delta.content
                if text_chunk:
                    await writer.write(text_chunk)
                    text += text_chunk
    await writer.aclose()
    return text


class TaskAssistant(Agent):
    def __init__(self, instructions: str, tools, **kwargs) -> None:
        super().__init__(instructions=instructions, tools=tools, **kwargs)

    # TODO: Verify this works
    async def llm_node( # pyrefly: ignore
        self,
        chat_ctx: llm.ChatContext,
        tools: list[FunctionTool | RawFunctionTool],
        model_settings: ModelSettings,
    )-> Union[AsyncGenerator[ChatChunk | str, None], str]: 
        if type(chat_ctx.items[-1]) is not FunctionCallOutput:
            task_names = ", ".join(
                [task["name"] for task in (await mongodb.get_tasks())]
            )
            await self.update_instructions(
                task_assistant_instructions
                + f"\n\nFor reference, the current task names are: {task_names}"
            )
            print("Calling default llm_node")
            return Agent.default.llm_node(self, chat_ctx, tools, model_settings)
        else:
            print("Streaming texts to topic")
            chat_gen = Agent.default.llm_node(self, chat_ctx, tools, model_settings)
            return await stream_taskassistant_text(chat_gen)


async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()

    lkapi = api.LiveKitAPI()
    room_service = lkapi.room

    async def update_room_metadata(update_type: str, ctx: RunContext, **kwargs):
        print("Updating Metadata!")
        try:
            assert ctx.session._room_io is not None, (
                "Session does not have _room_io set!"
            )
            update = UpdateRoomMetadataRequest(
                room=ctx.session._room_io._room.name,
                metadata=json.dumps(
                    {
                        "update_type": update_type,
                        "data": kwargs,
                        "updated_at": time.time(),
                    }
                ),
            )
            await room_service.update_room_metadata(update=update)
        except TypeError as te:
            print(te)

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=openai.LLM(model="gpt-4o-mini", max_completion_tokens=1000),
        vad=silero.VAD.load(),
    )

    @function_tool()
    async def create_task(
        context: RunContext,
        name: TaskName,
        is_complete: Optional[bool] = False,
        deadline: Optional[FutureDate] = None,
        description: Optional[TaskDescription] = None,
    ) -> str:
        """Create a new task for the user's task list. The task name should use the Title Case capitalization style.

        Args:
            name (TaskName): The name of the task to create.
            deadline (FutureDate | None, optional): The deadline (i.e. due date) of the task. Defaults to None.
            description (TaskDescription | None, optional): An additional description of the task. Defaults to None.
        """
        print(f"The 'create_task' tool was called with name = ({name}).")
        try:
            result = await mongodb.create_task(name, is_complete, deadline, description)

            # TODO: Create another logger for agent messages
            if result == "ERROR 1":
                return f"Failed to create new a task with the name '{name.strip().lower()}'. A task with that name already exists."

            if result == "ERROR 2":
                return f"Failed to create new a task with the name '{name.strip().lower()}'. An unknown error occurred."

            await update_room_metadata(
                "CREATE",
                context,
                name=name,
                is_complete=is_complete,
                deadline=deadline,
                description=description,
            )

            return f"Created a new task: '{name}'"

        except Exception as ex:
            raise ex

    @function_tool()
    async def edit_task(
        context: RunContext,
        name: TaskName,
        new_name: Optional[TaskName] = None,
        is_complete: Optional[bool] = None,
        new_deadline: Optional[FutureDate] = None,
        new_description: Optional[TaskDescription] = None,
    ) -> str:
        """Edit (i.e. change/update) an existing task, either by changing the task's name, or by changing a facet of the task, for example, the task's deadline.

        Args:
            name (TaskName): The name of the task to edit.
            new_name (TaskName | None, optional): The new name for the task being edited. Defaults to None.
            is_complete (bool | None, optional): The new completion status of the task being edited. Defaults to None.
            new_deadline (FutureDate | None, optional): The new deadline of the task bein edited. Defaults to None.
            new_description (TaskDescription | None, optional): The new description of the task being edited. Defaults to None.
        """
        try:
            updated_fields: dict[str, Any] = {}
            if new_name is not None:
                updated_fields["name"] = new_name
            if is_complete is not None:
                updated_fields["is_complete"] = is_complete
            if new_deadline is not None:
                updated_fields["deadline"] = new_deadline
            if new_description is not None:
                updated_fields["description"] = new_description

            result = await mongodb.edit_task(name, updated_fields)

            if result == "ERROR 1":
                return f"The task with the name '{name}' could not be edited. No fields were specified to be updated."

            if result == "ERROR 2":
                return f"The task with the name '{name}' could not be edited. An unknown error occured."

            if result == 0:
                return f"The task with the name '{name}' was not edited. The field(s) {"'" + "', '".join([k for k in updated_fields.keys()]) + "'"} did not need to be updated."

            await update_room_metadata(
                "EDIT",
                context,
                name=name,
                new_name=new_name,
                is_complete=is_complete,
                new_deadline=new_deadline,
                new_description=new_description,
            )

            return f"Edited the task: '{name}'."
        except Exception as ex:
            print("Error while editing task")
            raise ex

    @function_tool()
    async def delete_task(context: RunContext, name: TaskName) -> str:
        """Delete a task (i.e. remove it from the user's task list).

        Args:
            name (TaskName): The name of the task to delete.
        """
        try:
            result = await mongodb.delete_task(name)

            if result == 0:
                return f"Failed to delete a task with the name '{name}'. No matching task was found."

            await update_room_metadata("DELETE", context, name=name)

            return f"Deleted the task: '{name}'."
        except Exception as ex:
            print("Error while deleting task")
            raise ex

    @function_tool()
    async def invalid_request(context: RunContext):
        """Notifies the user that they have made an invalid request. Use this tool when a user's request does not pertain to managing their tasks."""
        return "Invalid Request."

    tools = [create_task, edit_task, delete_task, invalid_request]

    init_task_names = ", ".join([task["name"] for task in (await mongodb.get_tasks())])

    instructions = (
        task_assistant_instructions
        + f"\n\nFor reference, the current task names are: {init_task_names}"
    )

    task_assistant = TaskAssistant(instructions=instructions, tools=tools)

    await session.start(
        agent=task_assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
        room_output_options=RoomOutputOptions(
            transcription_enabled=True, audio_enabled=False
        ),
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
