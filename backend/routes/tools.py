from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/tools",
    tags=["tools"]
)

@router.post("/", response_model=schemas.Tool)
def create_tool(tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    db_tool = models.Tool(**tool.dict())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.get("/", response_model=List[schemas.Tool])
def read_tools(skip: int = 0, limit: int = 100, category: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Tool)
    if category:
        query = query.filter(models.Tool.category == category)
    return query.offset(skip).limit(limit).all()

@router.get("/{tool_id}", response_model=schemas.Tool)
def read_tool(tool_id: int, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if db_tool is None:
        raise HTTPException(status_code=404, detail="Outil non trouvé")
    return db_tool

@router.put("/{tool_id}", response_model=schemas.Tool)
def update_tool(tool_id: int, tool: schemas.ToolCreate, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if db_tool is None:
        raise HTTPException(status_code=404, detail="Outil non trouvé")
    
    for key, value in tool.dict().items():
        setattr(db_tool, key, value)
    
    db.commit()
    db.refresh(db_tool)
    return db_tool

@router.delete("/{tool_id}")
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    db_tool = db.query(models.Tool).filter(models.Tool.id == tool_id).first()
    if db_tool is None:
        raise HTTPException(status_code=404, detail="Outil non trouvé")
    
    db.delete(db_tool)
    db.commit()
    return {"message": "Outil supprimé avec succès"} 