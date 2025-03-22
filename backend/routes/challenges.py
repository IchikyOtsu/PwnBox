from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import re
from .. import models, schemas
from ..database import get_db
import os
import shutil
from datetime import datetime
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/challenges",
    tags=["challenges"]
)

# Configuration pour les fichiers
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.py', '.sh', '.exe', '.bin'}

# Créer le dossier uploads s'il n'existe pas
os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_file(file: UploadFile):
    # Vérifier la taille du fichier
    file.file.seek(0, 2)  # Se positionner à la fin du fichier
    size = file.file.tell()
    file.file.seek(0)  # Revenir au début du fichier
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Le fichier est trop volumineux (max 10MB)")
    
    # Vérifier l'extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé")

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

@router.post("/{challenge_id}/files", response_model=dict)
async def upload_file(
    challenge_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        validate_file(file)
        
        # Créer un dossier unique pour le challenge
        challenge_dir = os.path.join(UPLOAD_DIR, f"challenge_{challenge_id}")
        os.makedirs(challenge_dir, exist_ok=True)
        
        # Générer un nom de fichier unique
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(challenge_dir, filename)
        
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Mettre à jour les ressources du challenge
        if not challenge.resources:
            challenge.resources = {}
        if 'files' not in challenge.resources:
            challenge.resources['files'] = []
        
        file_info = {
            'filename': filename,
            'original_name': file.filename,
            'path': file_path,
            'uploaded_at': timestamp
        }
        
        challenge.resources['files'].append(file_info)
        db.commit()
        
        return file_info
        
    except Exception as e:
        print(f"Erreur lors de l'upload du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{challenge_id}/files/{filename}")
async def download_file(challenge_id: int, filename: str, db: Session = Depends(get_db)):
    try:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        if not challenge.resources or 'files' not in challenge.resources:
            raise HTTPException(status_code=404, detail="Aucun fichier trouvé")
        
        file_info = next(
            (f for f in challenge.resources['files'] if f['filename'] == filename),
            None
        )
        
        if not file_info:
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        return FileResponse(
            file_info['path'],
            filename=file_info['original_name'],
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{challenge_id}/files/{filename}")
async def delete_file(challenge_id: int, filename: str, db: Session = Depends(get_db)):
    try:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        if not challenge.resources or 'files' not in challenge.resources:
            raise HTTPException(status_code=404, detail="Aucun fichier trouvé")
        
        file_info = next(
            (f for f in challenge.resources['files'] if f['filename'] == filename),
            None
        )
        
        if not file_info:
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Supprimer le fichier
        os.remove(file_info['path'])
        
        # Mettre à jour les ressources
        challenge.resources['files'] = [
            f for f in challenge.resources['files'] 
            if f['filename'] != filename
        ]
        
        db.commit()
        return {"message": "Fichier supprimé avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{challenge_id}/check-flag", response_model=dict)
def check_flag(challenge_id: int, flag_check: schemas.FlagCheck, db: Session = Depends(get_db)):
    try:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        # Vérifier si le flag correspond exactement
        if challenge.correct_flag and flag_check.flag == challenge.correct_flag:
            return {"status": "success", "message": "Flag correct !"}
        
        return {"status": "error", "message": "Flag incorrect"}
    except Exception as e:
        print(f"Erreur lors de la vérification du flag: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Une erreur est survenue lors de la vérification du flag: {str(e)}"
        )

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