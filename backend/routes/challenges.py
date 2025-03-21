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
    try:
        print(f"Tentative de création d'un challenge avec les données: {challenge.dict()}")
        
        if not challenge.title or not challenge.description or not challenge.category:
            raise HTTPException(
                status_code=400,
                detail="Le titre, la description et la catégorie sont requis"
            )
        
        # S'assurer que resources est un dictionnaire valide
        if challenge.resources is None:
            challenge.resources = {}
        
        # Convertir les données en dictionnaire et retirer les champs None
        challenge_data = {k: v for k, v in challenge.dict().items() if v is not None}
        print(f"Données nettoyées pour la création: {challenge_data}")
        
        db_challenge = models.Challenge(**challenge_data)
        print(f"Challenge créé en mémoire: {db_challenge.__dict__}")
        
        db.add(db_challenge)
        db.commit()
        db.refresh(db_challenge)
        print(f"Challenge sauvegardé en base de données avec l'ID: {db_challenge.id}")
        return db_challenge
    except Exception as e:
        print(f"Erreur lors de la création du challenge: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de la création du challenge: {str(e)}"
        )

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

@router.delete("/{challenge_id}")
def delete_challenge(challenge_id: int, db: Session = Depends(get_db)):
    try:
        db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if db_challenge is None:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        db.delete(db_challenge)
        db.commit()
        return {"message": "Challenge supprimé avec succès"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de la suppression du challenge: {str(e)}"
        )

@router.put("/{challenge_id}", response_model=schemas.Challenge)
def update_challenge(challenge_id: int, challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    try:
        db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if db_challenge is None:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        # Mettre à jour les champs
        for key, value in challenge.dict(exclude_unset=True).items():
            setattr(db_challenge, key, value)
        
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de la mise à jour du challenge: {str(e)}"
        )

@router.patch("/{challenge_id}/toggle-solved", response_model=schemas.Challenge)
def toggle_challenge_solved(challenge_id: int, db: Session = Depends(get_db)):
    try:
        db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if db_challenge is None:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        db_challenge.solved = not db_challenge.solved
        db.commit()
        db.refresh(db_challenge)
        return db_challenge
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de la mise à jour du statut du challenge: {str(e)}"
        ) 