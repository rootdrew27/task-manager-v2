from typing import Annotated
from pydantic import Field

# TaskName = constr(min_length=1, max_length=38)
# TaskDescription = constr(min_length=2, max_length=128)

TaskName = Annotated[str, Field(max_length=38, min_length=1)]
TaskDescription = Annotated[str, Field(max_length=128, min_length=1)]

class TaskError(Exception):
    """Base exception for task operations"""
    pass

class TaskNotFoundError(TaskError):
    """Raised when a task is not found"""
    pass

class TaskAlreadyExistsError(TaskError):
    """Raised when trying to create a duplicate task"""
    pass