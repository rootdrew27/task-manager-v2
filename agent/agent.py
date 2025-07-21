from dataclasses import dataclass
import time
import json
from typing import Any, Literal, Optional
import logging

from dotenv import load_dotenv
from custom_types import (
    TaskName,
    TaskDescription,
    TaskError,
    TaskNotFoundError,
    TaskAlreadyExistsError,
    FutureDatetime,
    Tools,
)
import db
from utils import DateTimeEncoder
from livekit import api
from livekit.protocol.room import UpdateRoomMetadataRequest
from livekit import agents
from livekit.agents.types import NOT_GIVEN
from livekit.agents import (
    AgentSession,
    RoomInputOptions,
    RoomOutputOptions,
    function_tool,
    RunContext,
    get_job_context,
)
from livekit.plugins import openai, deepgram, silero, cartesia

from task_assistant import TaskAssistant

from prompts import TASK_ASSISTANT_INSTRUCTIONS_TEMPLATE

load_dotenv(".env", verbose=True)

logger = logging.getLogger("Agent")

TOOL_NAMES = ["create_task", "edit_task", "delete_task", "invalid_request"]

TOOL_INSTRUCTIONS = (
    "When the user requests to create, add, or make a new task you will use the 'create_task' function. "
    "When the user requests to edit, modify, or change a task in any way, you will use the 'edit_task' function. "
    "When the user requests to delete, remove, or clear a task you will use the 'delete_task' function. "
    "When the user requests anything unrelated to managing their tasks you will use the 'invalid_request' function. "
)

task_assistant_instructions = TASK_ASSISTANT_INSTRUCTIONS_TEMPLATE.format(
    tools=", ".join(TOOL_NAMES), tool_instructions=TOOL_INSTRUCTIONS
)


@dataclass
class UserData:
    id: str


async def get_user_data(ctx: agents.JobContext):
    user_participant = await ctx.wait_for_participant()
    return UserData(id=user_participant.identity)


async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()

    lkapi = api.LiveKitAPI()
    room_service = lkapi.room

    await db.init_pool()

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
                    },
                    cls=DateTimeEncoder,
                ),
            )
            await room_service.update_room_metadata(update=update)
        except TypeError as te:
            logger.error(te)

    userdata = await get_user_data(ctx)

    ac = await db.getAgentConfig(userdata.id)

    session = AgentSession[UserData](
        stt=deepgram.STT(model=ac.stt_model, api_key=ac.stt_key, language="multi"),
        llm=openai.LLM(
            model=ac.llm_model, api_key=ac.llm_key, max_completion_tokens=2500
        ),
        tts=cartesia.TTS(model=ac.tts_model, api_key=ac.tts_key)
        if ac.tts_key is not None and ac.tts_model is not None
        else NOT_GIVEN,
        vad=silero.VAD.load(),
        userdata=userdata,
    )

    @function_tool()
    async def create_task(
        context: RunContext,
        name: TaskName,
        is_complete: Optional[bool] = False,
        deadline: Optional[FutureDatetime] = None,
        description: Optional[TaskDescription] = None,
    ) -> str:
        """Create a new task for the user's task list. The task name should use the Title Case capitalization style.

        Args:
            name (TaskName): The name of the task to create.
            deadline (FutureDatetime | None, optional): The deadline (i.e. due date) of the task. Must in a 24-hour time format. Defaults to None.
            description (TaskDescription | None, optional): An additional description of the task. Defaults to None.
        """
        logger.info(f"The 'create_task' tool was called with name = ({name}).")
        try:
            user_id = context.session.userdata.id
            result = await db.create_task(
                user_id, name, is_complete, deadline, description
            )

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

            return f"Created a new task: '{name}'."

        except Exception as ex:
            raise ex

    @function_tool()
    async def edit_task(
        context: RunContext,
        name: TaskName,
        new_name: Optional[TaskName],
        is_complete: Optional[bool],
        new_deadline: FutureDatetime | Literal["No Update"] | None,
        new_description: Optional[TaskDescription],
    ) -> str:
        """Edit (i.e. change/update) an existing task. This function can alter the task's name, the task's completion status, the task's deadline, and the task's description. Edits to each facet are optional.

        Args:
            name (TaskName): The name of the task being edited.
            new_name (Optional[TaskName]): The new name for the task, or None for no new name.
            is_complete (bool | None): The completion status of the task. Pass None to forgo updating it.
            new_deadline (FutureDatetime | Literal["No Update"] | None): The new deadline of the task. Pass "No Update" to forgo updating it. Pass None to remove it.
            new_description (TaskDescription | None): The new description of the task. Pass an empty string to remove the description. Pass None to forgo updating it.

        """
        logger.info(f"The edit_task tool was called with name = ({name})")
        user_id = context.session.userdata.id
        try:
            updated_fields: dict[str, Any] = {}
            if new_name is not None:
                updated_fields["name"] = new_name
            if is_complete is not None:
                updated_fields["is_complete"] = is_complete
            if new_deadline != "No Update":
                updated_fields["deadline"] = new_deadline
            if new_description is not None:
                updated_fields["description"] = new_description

            updated_task = await db.edit_task(user_id, name, updated_fields)

            if isinstance(updated_task, ValueError):
                return f"The task with the name '{name}' could not be edited. No fields were specified to be updated."

            if isinstance(updated_task, TaskError):
                return f"The task with the name '{name}' could not be edited. An unknown error occured."

            if isinstance(updated_task, TaskNotFoundError):
                return f"The task with the name '{name}' was not edited. Either the task could not be found, or the field(s) {"'" + "', '".join([k for k in updated_fields.keys()]) + "'"} did not need to be updated."

            await update_room_metadata(
                "EDIT", context, initial_name=name, task=updated_task.model_dump()
            )

            return f"Edited the task: '{name}'."
        except Exception as ex:
            logger.error("Error while editing task, %s.", ex)
            return "An unknown error occurred."

    @function_tool()
    async def delete_task(context: RunContext, name: TaskName) -> str:
        """Delete a task (i.e. remove it from the user's task list).

        Args:
            name (TaskName): The name of the task to delete.
        """
        logger.info(f"The delete_task tool was called with name = ({name})")
        user_id = context.session.userdata.id
        try:
            result = await db.delete_task(user_id, name)

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

    tools: Tools = [create_task, edit_task, delete_task, invalid_request]

    room = get_job_context().room
    writer = await room.local_participant.stream_text(topic="task-assistant--text")

    task_assistant = TaskAssistant(
        writer, init_instructions=task_assistant_instructions, tools=tools
    )

    await session.start(
        agent=task_assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
        room_output_options=RoomOutputOptions(
            transcription_enabled=True, audio_enabled=False
        ),
    )
    await task_assistant._update_instructions(task_assistant_instructions)


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
