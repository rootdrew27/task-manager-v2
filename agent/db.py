from typing import Dict
from typing import Any, TypedDict, Optional
from datetime import date
import logging
from pydantic import FutureDate
from pymongo import AsyncMongoClient
from custom_types import TaskName, TaskDescription

pymongo_logger = logging.getLogger("pymongo")
pymongo_logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("pymongo.log")
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
file_handler.setFormatter(formatter)
pymongo_logger.addHandler(file_handler)

class Task(TypedDict, total=False):
    _id: str
    name: str
    is_complete: bool
    deadline: date | None
    description: str | None


MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "task-management"
COLLECTION_NAME = "tasks"


client = AsyncMongoClient(MONGO_URI, maxPoolSize=5)  # Adjust maxPoolSize as needed
db = client["task-management"]
tasks_collection = db["tasks"]


async def get_tasks() -> list[Task]:
    """Fetch all tasks from the database."""
    return [Task(**task) async for task in tasks_collection.find({}, {"_id": 0})]


async def create_task(
    name: TaskName,
    is_complete: Optional[bool] = None,
    deadline: Optional[date] = None,
    description: Optional[TaskDescription] = None,
):
    """Add a new task if it does not already exist (case-insensitive)."""
    try:
        filter_ = {"name": {"$regex": f"^{name}$", "$options": "i"}}
        if await tasks_collection.find_one(filter_):
            logging.info(f"Task already exists: {name}")
            return "ERROR 1"
        task: Task = {
            "name": name,
            "is_complete": is_complete if (is_complete is not None) else (False),
            "deadline": deadline,
            "description": description,
        }
        return await tasks_collection.insert_one(task)
    except Exception as ex:
        logging.error(f"Error in db.create_task: {ex}")
        return "ERROR 2"


async def edit_task(
    name: TaskName,
    updated_fields: Dict[str, Any]
):
    """Edit an existing task by name (case-insensitive)."""
    try:

        if not updated_fields:
            return "ERROR 1"

        filter_ = {"name": {"$regex": f"^{name}$", "$options": "i"}}
        result = await tasks_collection.update_one(filter_, {"$set": updated_fields})

        return result.modified_count

    except Exception as ex:
        logging.error(f"Error in db.edit_task: {ex}")
        return "ERROR 2"

async def delete_task(name: TaskName):
    """Delete a task by name (case-insensitive)."""
    try:

        filter_ = {"name": {"$regex": f"^{name}$", "$options": "i"}}
        result = await tasks_collection.delete_one(filter_)
        return result.deleted_count
    
    except Exception as ex:
        logging.error(f"Error in db.delete_task: {ex}")
        return "ERROR 1"
