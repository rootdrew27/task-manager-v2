from typing import Union
from livekit.agents.llm.llm import ChatChunk, ChoiceDelta
from livekit.agents.llm.chat_context import FunctionCallOutput
from typing import AsyncGenerator


from contextlib import asynccontextmanager

from livekit.agents.job import get_job_context
import time
import json
from typing import Any, Optional
import logging

from dotenv import load_dotenv

from pydantic import FutureDate

from custom_types import (
    TaskName,
    TaskDescription,
    TaskError,
    TaskNotFoundError,
    TaskAlreadyExistsError,
)
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

load_dotenv(".env", verbose=True)

logger = logging.getLogger(__name__)

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


class TaskAssistant(Agent):
    def __init__(self, instructions: str, tools, **kwargs) -> None:
        super().__init__(instructions=instructions, tools=tools, **kwargs)

    # TODO: Verify this works
    async def llm_node(  # pyrefly: ignore
        self,
        chat_ctx: llm.ChatContext,
        tools: list[FunctionTool | RawFunctionTool],
        model_settings: ModelSettings,
    ):
        if isinstance(chat_ctx.items[-1], FunctionCallOutput): # Function was called previously. Return text to the user.
            async for chunk in self._stream_with_text_output(
                chat_ctx, tools, model_settings
            ):
                yield chunk
        else: # return
            await self._update_task_context()
            async for chunk in Agent.default.llm_node(
                self, chat_ctx, tools, model_settings
            ):
                yield chunk

    async def _stream_with_text_output(self, chat_ctx, tools, model_settings):
        """Stream LLM output while also writing to text stream"""
        try:
            async with self.text_stream_writer() as writer:
                async for chunk in Agent.default.llm_node(
                    self, chat_ctx, tools, model_settings
                ):
                    if isinstance(chunk, ChatChunk):
                        content = getattr(chunk.delta, "content", None) if hasattr(chunk, "delta") else None
                        if isinstance(content, str):
                            await writer.write(content)
                    yield chunk
        except Exception as ex:
            logger.error(f"Issue streaming text to topic. Error: {ex}.")

    @asynccontextmanager
    async def text_stream_writer(self):
        """Context manager for text stream writer"""
        room = get_job_context().room
        writer = await room.local_participant.stream_text(topic="task-assistant--text")
        try:
            yield writer
        finally:
            await writer.aclose()

    async def _update_task_context(self):
        """Update agent instructions with current task names."""
        tasks = await mongodb.get_tasks()
        task_names = ", ".join(task.get("name", "") for task in tasks)
        instructions = (
            task_assistant_instructions
            + f"\n\nFor reference, the current task names are: {task_names}"
        )
        await self.update_instructions(instructions)


async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()

    lkapi = api.LiveKitAPI()
    room_service = lkapi.room

    async def update_room_metadata(update_type: str, ctx: RunContext, **kwargs):
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
            logger.error(te)

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
        logger.info(f"The 'create_task' tool was called with name = ({name}).")
        try:
            result = await mongodb.create_task(name, is_complete, deadline, description)

            # TODO: Create another logger for agent messages
            if isinstance(result, TaskAlreadyExistsError):
                return f"Failed to create new a task with the name '{name.strip().lower()}'. A task with that name already exists."

            if isinstance(result, TaskError):
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
        logger.info(f"The edit_task tool was called with name = ({name})")
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

            if isinstance(result, ValueError):
                return f"The task with the name '{name}' could not be edited. No fields were specified to be updated."

            if isinstance(result, TaskError):
                return f"The task with the name '{name}' could not be edited. An unknown error occured."

            if isinstance(result, TaskNotFoundError):
                return f"The task with the name '{name}' was not edited. Either the task could not be found, or the field(s) {"'" + "', '".join([k for k in updated_fields.keys()]) + "'"} did not need to be updated."

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
            logger.error("Error while editing task")
            raise ex

    @function_tool()
    async def delete_task(context: RunContext, name: TaskName) -> str:
        """Delete a task (i.e. remove it from the user's task list).

        Args:
            name (TaskName): The name of the task to delete.
        """
        logger.info(f"The delete_task tool was called with name = ({name})")
        try:
            result = await mongodb.delete_task(name)

            if isinstance(result, TaskNotFoundError):
                return f"Failed to delete a task with the name '{name}'. No matching task was found."

            if isinstance(result, TaskError):
                return f"Failed to delete a task with the name '{name}'. An unknown error occurred."

            await update_room_metadata("DELETE", context, name=name)

            return f"Deleted the task: '{name}'."
        except Exception as ex:
            logger.error("Error while deleting task")
            raise ex

    @function_tool()
    async def invalid_request(context: RunContext):
        """Notifies the user that they have made an invalid request. Use this tool when a user's request does not pertain to managing their tasks."""
        logger.info("The invalid_request tool was called.")
        return "Invalid Request."

    tools = [create_task, edit_task, delete_task, invalid_request]

    init_task_names = ", ".join(
        [task.get("name", "") for task in (await mongodb.get_tasks())]
    )

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
