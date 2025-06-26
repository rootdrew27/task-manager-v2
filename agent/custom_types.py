from pydantic import constr

TaskName = constr(min_length=1, max_length=38)
TaskDescription = constr(min_length=2, max_length=128)