from datetime import datetime
from typing import Dict
from typing import Any, Optional
import logging
from dotenv import load_dotenv
import os
from pydantic import BaseModel, FutureDate
from custom_types import (
    TaskName,
    TaskDescription,
    TaskError,
    TaskAlreadyExistsError,
)

from psycopg import sql, errors
from psycopg.rows import class_row
from psycopg_pool import AsyncConnectionPool

logger = logging.getLogger("psycopg")

load_dotenv(".env", verbose=True)

pool = AsyncConnectionPool(conninfo=os.environ.get("DATABASE_URL", ""), open=False)


async def init_pool():
    await pool.open()


class Task(BaseModel):
    name: str
    is_complete: bool
    deadline: Optional[datetime]
    description: Optional[str]


# TODO: Create a service that deletes collections starting with a '#' after X minutes of inactivity.


async def get_tasks(user_id: str) -> list[Task]:
    """Fetch all tasks from the database."""
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=class_row(Task)) as cur:
            await cur.execute(
                """SELECT name, description, deadline, is_complete
                 FROM task WHERE user_id = %s;""",
                (user_id,),
            )
            return await cur.fetchall()  # TODO: optionally yield these


async def create_task(
    user_id: str,
    name: TaskName,
    is_complete: Optional[bool] = None,
    deadline: Optional[FutureDate] = None,
    description: Optional[TaskDescription] = None,
):
    """Add a new task if it does not already exist (case-insensitive)."""
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            try:
                await cur.execute(
                    """INSERT INTO task (user_id, name, is_complete, deadline, description) VALUES (%s, %s, %s, %s, %s);""",
                    (user_id, name, is_complete, deadline, description),
                )
                if cur.rowcount != 1:
                    raise Exception(
                        "Modified row count (i.e. cur.rowcount) did not equal 1."
                    )
                return "Success"
            except errors.UniqueViolation:
                logging.info(
                    f"Unique constraint violation by {user_id}, while creating task, with name = ({name})."
                )
                return TaskAlreadyExistsError()
            except Exception as ex:
                logger.error(
                    f"An unexpected error occurred while creating a task for user ({user_id}). Task Info: name = ({name}), is_complete = ({is_complete}), deadline = ({deadline}), description = ({description}).\nError Type: {type(ex)}\nError: {ex}\n"
                )
                return TaskError()


async def edit_task(user_id: str, name: TaskName, updated_fields: Dict[str, Any]):
    """Edit an existing task by name (case-insensitive)."""
    if not updated_fields:
        return ValueError()
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=class_row(Task)) as cur:
            try:
                set_fragments = [
                    sql.SQL("{col_name} = %s").format(col_name=sql.Identifier(col))
                    for col in updated_fields.keys()
                ]
                query = sql.SQL(
                    """
                    UPDATE task
                    SET {sets}
                    WHERE user_id = %s
                    AND LOWER(name) = LOWER(%s)
                    RETURNING *;
                    """
                ).format(
                    sets=sql.SQL(", ").join(set_fragments)
                )  # TODO: consider using citext instead of LOWER stmts
                await cur.execute(
                    query, tuple(updated_fields.values()) + (user_id, name)
                )
                updated_task = await cur.fetchone()
                if not updated_task:
                    raise Exception("No result returned.")
                return updated_task
            except errors.UniqueViolation:
                logger.info(
                    f"Unique constraint violation by user ({user_id}). Error occured while editing the task with name = ({name}). The new name was to be ({updated_fields.get('name')})."
                )
                return TaskAlreadyExistsError()
            except Exception as ex:
                logger.error(
                    f"An unexpected error occurred while editing a task for user ({user_id}). Task Info: name = ({name}). Other task update info = ({updated_fields}).\nError Type: {type(ex)}.\nError: {ex}.\n"
                )
                return TaskError()


async def delete_task(user_id: str, name: TaskName):
    """Delete a task by name (case-insensitive)."""
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            try:
                query = """
                    DELETE FROM task
                    WHERE user_id = %s
                    AND LOWER(name) = LOWER(%s);
                    """
                await cur.execute(query, (user_id, name))
                if cur.rowcount != 1:
                    raise Exception(
                        f"Row count must equal 1, but rowcount=({cur.rowcount})"
                    )
                return "Success"
            except Exception as ex:
                logger.error(
                    f"An unexpected error occurred while deleting a task for user ({user_id}). Task Info: name = ({name}).\nError Type: {type(ex)}.\nError: {ex}.\n"
                )
                return TaskError()


class ModelConfig(BaseModel):
    id: int
    user_id: str
    provider: str
    key: str
    model: str


class AllModelConfig(BaseModel):
    stt_provider: str
    stt_key: str
    stt_model: str

    llm_provider: str
    llm_key: str
    llm_model: str

    tts_provider: Optional[str]
    tts_key: Optional[str]
    tts_model: Optional[str]


async def getAgentConfig(user_id: str):
    encryption_key = os.environ.get("PG_ENCRYPTION_KEY")
    if not encryption_key:
        raise Exception(
            "PG_ENCRYPTION_KEY environment variable is required for API key decryption"
        )

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=class_row(AllModelConfig)) as cur:
            try:
                query = """
                    SELECT stt.provider AS stt_provider, 
                           task_manager.decrypt_api_key(stt.key, %s) AS stt_key, 
                           stt.model AS stt_model, 
                           llm.provider AS llm_provider, 
                           task_manager.decrypt_api_key(llm.key, %s) AS llm_key, 
                           llm.model AS llm_model, 
                           tts.provider AS tts_provider, 
                           task_manager.decrypt_api_key(tts.key, %s) AS tts_key, 
                           tts.model AS tts_model
                    FROM stt JOIN llm ON stt.user_id = llm.user_id 
                    LEFT JOIN tts ON stt.user_id = tts.user_id 
                    WHERE stt.user_id = %s;
                    """
                await cur.execute(
                    query, (encryption_key, encryption_key, encryption_key, user_id)
                )
                agent_config = await cur.fetchone()
                if agent_config is None:
                    raise Exception("No result returned.")
                return agent_config
            except Exception as ex:
                logger.error(
                    f"An unknown exception occurred in getAgentConfig.\nError Type: {type(ex)}.\nError: {ex}.\n"
                )
                raise ex
