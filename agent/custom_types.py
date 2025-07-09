from typing import Annotated
from pydantic import Field
from datetime import datetime
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

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


def validate_future_local_datetime(value: datetime) -> datetime:
    now_local = datetime.now().astimezone()  # Local time with tzinfo
    if value <= now_local:
        raise ValueError(
            f"Datetime must be in the future (local time). Got: {value.isoformat()} <= {now_local.isoformat()}"
        )
    return value


class FutureLocalDateTime:
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_after_validator_function(
            validate_future_local_datetime, handler(datetime)
        )


FutureDatetime = Annotated[datetime, FutureLocalDateTime]
