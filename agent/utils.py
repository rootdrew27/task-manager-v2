from datetime import date, datetime
import json


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that formats datetime objects using the specified format."""

    def default(self, o):
        if isinstance(o, (datetime, date)):
            return o.strftime("%A, %B %d, %Y at %I:%M %p")
        return super().default(o)
