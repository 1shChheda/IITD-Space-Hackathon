from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
from .item import Position


class LogDetails(BaseModel):
    from_container: Optional[str] = None
    to_container: Optional[str] = None
    position: Optional[Position] = None
    reason: Optional[str] = None


class Log(BaseModel):
    timestamp: datetime
    user_id: str
    action_type: str  # "placement", "retrieval", "rearrangement", "disposal"
    item_id: str
    details: LogDetails


class LogInDB(Log):
    #Log model as stored in the database
    _id: str