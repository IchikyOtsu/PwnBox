from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)

@router.post("/", response_model=schemas.Folder)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = models.Folder(**folder.dict())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.get("/", response_model=List[schemas.Folder])
def get_folders(db: Session = Depends(get_db)):
    return db.query(models.Folder).all()

@router.get("/{folder_id}", response_model=schemas.Folder)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.put("/{folder_id}", response_model=schemas.Folder)
def update_folder(folder_id: int, folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if db_folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    for key, value in folder.dict().items():
        setattr(db_folder, key, value)
    
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if db_folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Supprimer toutes les notes du dossier
    db.query(models.Note).filter(models.Note.folder_id == folder_id).delete()
    
    # Supprimer le dossier
    db.delete(db_folder)
    db.commit()
    return {"message": "Folder deleted successfully"}

@router.put("/{folder_id}/move")
def move_folder(folder_id: int, new_parent_id: int, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if db_folder is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if new_parent_id:
        new_parent = db.query(models.Folder).filter(models.Folder.id == new_parent_id).first()
        if new_parent is None:
            raise HTTPException(status_code=404, detail="New parent folder not found")
    
    db_folder.parent_id = new_parent_id
    db.commit()
    return {"message": "Folder moved successfully"} 