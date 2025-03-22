from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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

class FileCreate(FileBase):
    challenge_id: int

class File(FileBase):
    id: int
    challenge_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChallengeBase(BaseModel):
    title: str
    description: str
    category: str
    difficulty: Optional[str] = None
    correct_flag: Optional[str] = None
    resources: Optional[Dict[str, Any]] = None

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    solved: bool = False
    created_at: datetime
    updated_at: datetime
    files: List[File] = []
    
    class Config:
        from_attributes = True

class FlagCheck(BaseModel):
    flag: str

class NoteBase(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []
    is_favorite: Optional[bool] = False
    folder_id: Optional[int] = None
    parent_id: Optional[int] = None

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    children: List['Note'] = []
    
    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    children: List['Folder'] = []
    notes: List[Note] = []
    
    class Config:
        from_attributes = True

Note.model_rebuild()
Folder.model_rebuild() 