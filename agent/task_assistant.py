from contextlib import asynccontextmanager
from datetime import datetime
import json
import logging
from livekit.agents.llm.llm import ChatChunk
from livekit.agents.llm.chat_context import FunctionCallOutput
from livekit.agents.job import get_job_context
from livekit.agents.voice import ModelSettings
from livekit.agents import (
    llm,
    Agent,
    FunctionTool,
)
from livekit.agents.llm import RawFunctionTool
import db
from utils import DateTimeEncoder
from custom_types import Tools

logger = logging.getLogger("Agent")


class TaskAssistant(Agent):
    def __init__(
        self, text_writer, init_instructions: str = "", tools: Tools = None, **kwargs
    ) -> None:
        self.init_instructions = init_instructions
        self.writer = text_writer
        super().__init__(instructions=init_instructions, tools=tools, **kwargs)

    # TODO: Verify this works
    async def llm_node(  # pyrefly: ignore
        self,
        chat_ctx: llm.ChatContext,
        tools: list[FunctionTool | RawFunctionTool],
        model_settings: ModelSettings,
    ):
        print(f"IN LLM NODE. Previous chat type is ({type(chat_ctx.items[-1])}).")
        if isinstance(
            chat_ctx.items[-1], FunctionCallOutput
        ):  # Function was called previously. Return text to the user.
            print("STREAMING TEXT")
            async for chunk in self._stream_with_text_output(
                chat_ctx, tools, model_settings
            ):
                yield chunk
        else:
            print("NOT STREAMING TEXT")
            await self._update_instructions(base=self.init_instructions)
            async for chunk in Agent.default.llm_node(
                self, chat_ctx, tools, model_settings
            ):
                yield chunk

    async def _stream_with_text_output(self, chat_ctx, tools, model_settings):
        """Stream LLM output while also writing to text stream"""
        try:
            # async with self.text_stream_writer() as writer:
            print("Writer info:", self.writer.info)
            async for chunk in Agent.default.llm_node(
                self, chat_ctx, tools, model_settings
            ):
                if isinstance(chunk, ChatChunk):
                    content = (
                        getattr(chunk.delta, "content", None)
                        if hasattr(chunk, "delta")
                        else None
                    )
                    print("Content:", content)
                    if isinstance(content, str):
                        await self.writer.write(content)
                elif isinstance(chunk, str):
                    await self.writer.write(chunk)
                else:
                    raise Exception(
                        "Expected default llm_node to yield a ChatChunk or a string"
                    )
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

    async def _update_instructions(self, base: str):
        cur = await self._update_task_context(base)
        cur = await self._update_datetime_context(cur)
        await self.update_instructions(cur)

    async def _update_task_context(self, cur: str):
        """Update agent instructions with current task names."""
        user_id = self.session.userdata.id
        tasks = await db.get_tasks(user_id)
        task_names = ", ".join(task.name for task in tasks)
        return (
            cur
            + f"\n\nFor reference, the current task names are: {task_names}.\n\nAdditionally, here is the data pertaining to the current tasks:\n {'\n'.join([json.dumps(task.model_dump(exclude={'id', 'user_id'}), separators=(',', ':'), cls=DateTimeEncoder) for task in tasks])}.\n"
        )

    async def _update_datetime_context(self, cur: str):
        """Update agent instructions with current datetime."""
        now = datetime.now()
        formatted_datetime = now.astimezone()
        datetime_instructions = f"\n\nLastly, for reference, the current date and time is: {formatted_datetime}. "

        return cur + datetime_instructions
