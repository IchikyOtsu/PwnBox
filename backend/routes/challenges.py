from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import re
from .. import models, schemas
from ..database import get_db
import os

router = APIRouter(
    prefix="/challenges",
    tags=["challenges"]
)

@router.post("/", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    db_challenge = models.Challenge(**challenge.dict())
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

@router.get("/", response_model=List[schemas.Challenge])
def read_challenges(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    status: str = None,
    difficulty: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Challenge)
    if category:
        query = query.filter(models.Challenge.category == category)
    if status:
        query = query.filter(models.Challenge.status == status)
    if difficulty:
        query = query.filter(models.Challenge.difficulty == difficulty)
    return query.offset(skip).limit(limit).all()

@router.get("/{challenge_id}", response_model=schemas.Challenge)
def read_challenge(challenge_id: int, db: Session = Depends(get_db)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge non trouvé")
    return db_challenge

@router.post("/{challenge_id}/files/", response_model=schemas.File)
async def upload_challenge_file(
    challenge_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge non trouvé")
    
    # Créer le dossier pour les fichiers si nécessaire
    upload_dir = f"uploads/challenge_{challenge_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Sauvegarder le fichier
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Créer l'entrée dans la base de données
    db_file = models.File(
        challenge_id=challenge_id,
        name=file.filename,
        path=file_path,
        file_type=file.content_type
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.post("/{challenge_id}/check-flag")
def check_flag(challenge_id: int, flag_check: schemas.FlagCheck, db: Session = Depends(get_db)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if db_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge non trouvé")
    
    if db_challenge.flag_pattern:
        # Vérifier si le flag correspond au pattern
        if re.match(db_challenge.flag_pattern, flag_check.flag):
            db_challenge.status = "completed"
            db.commit()
            return {"message": "Flag correct !", "status": "success"}
        return {"message": "Flag incorrect", "status": "error"}
    else:
        return {"message": "Aucun pattern de flag défini pour ce challenge", "status": "error"} 