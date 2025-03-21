from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ToolBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    command: Optional[str] = None
    url: Optional[str] = None

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FileBase(BaseModel):
    name: str
    path: str
    file_type: Optional[str] = None
    analysis_results: Optional[str] = None

class FileCreate(FileBase):
    challenge_id: int

class File(FileBase):
    id: int
    challenge_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChallengeBase(BaseModel):
    name: str
    category: str
    difficulty: Optional[str] = None
    status: str = "not_started"
    source: Optional[str] = None
    flag_pattern: Optional[str] = None
    notes: Optional[str] = None
    writeup: Optional[str] = None

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    files: List[File] = []
    
    class Config:
        from_attributes = True

class FlagCheck(BaseModel):
    challenge_id: int
    flag: str 