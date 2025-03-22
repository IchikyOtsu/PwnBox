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
import mimetypes

router = APIRouter(
    prefix="/challenges",
    tags=["challenges"]
)

# Configuration pour les fichiers
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.py', '.sh', '.exe', '.bin'}

# Créer le dossier uploads s'il n'existe pas
print(f"Création du dossier uploads à: {UPLOAD_DIR}")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_challenge_dir(challenge_id: int) -> str:
    """Retourne le chemin du dossier pour un challenge spécifique."""
    return os.path.join(UPLOAD_DIR, f"challenge_{challenge_id}")

def ensure_challenge_resources(challenge):
    """S'assure que la structure des ressources est correcte."""
    if not challenge.resources:
        challenge.resources = {"files": [], "links": [], "commands": []}
    if 'files' not in challenge.resources:
        challenge.resources['files'] = []
    return challenge.resources

def validate_file(file: UploadFile):
    try:
        print(f"Validation du fichier: {file.filename}")
        print(f"Type de contenu: {file.content_type}")
        
        # Vérifier la taille du fichier
        file.file.seek(0, 2)  # Se positionner à la fin du fichier
        size = file.file.tell()
        file.file.seek(0)  # Revenir au début du fichier
        
        print(f"Taille du fichier: {size} bytes")
        
        if size > MAX_FILE_SIZE:
            print(f"Fichier trop volumineux: {size} > {MAX_FILE_SIZE}")
            raise HTTPException(status_code=400, detail="Le fichier est trop volumineux (max 10MB)")
        
        # Vérifier l'extension
        ext = os.path.splitext(file.filename)[1].lower()
        print(f"Extension du fichier: {ext}")
        
        if ext not in ALLOWED_EXTENSIONS:
            print(f"Extension non autorisée: {ext}")
            print(f"Extensions autorisées: {ALLOWED_EXTENSIONS}")
            raise HTTPException(status_code=400, detail=f"Type de fichier non autorisé. Extensions autorisées: {', '.join(ALLOWED_EXTENSIONS)}")
        
        print("Validation du fichier réussie")
    except HTTPException as e:
        print(f"Erreur de validation: {str(e)}")
        raise e
    except Exception as e:
        print(f"Erreur inattendue lors de la validation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la validation du fichier: {str(e)}")

@router.post("/", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    try:
        print(f"Tentative de création d'un challenge avec les données: {challenge.dict()}")
        
        if not challenge.title or not challenge.description or not challenge.category:
            raise HTTPException(
                status_code=400,
                detail="Le titre, la description et la catégorie sont requis"
            )
        
        # Initialiser les ressources avec une structure par défaut
        default_resources = {
            "files": [],
            "links": [],
            "commands": []
        }
        
        # Convertir les données en dictionnaire et retirer les champs None
        challenge_data = {k: v for k, v in challenge.dict().items() if v is not None}
        
        # S'assurer que les ressources sont correctement initialisées
        if 'resources' not in challenge_data:
            challenge_data['resources'] = default_resources
        else:
            # Fusionner les ressources existantes avec la structure par défaut
            for key in default_resources:
                if key not in challenge_data['resources']:
                    challenge_data['resources'][key] = default_resources[key]
        
        print(f"Données nettoyées pour la création: {challenge_data}")
        
        # Créer le dossier pour les fichiers du challenge
        challenge_id = None  # Pour stocker l'ID temporairement
        try:
            db_challenge = models.Challenge(**challenge_data)
            db.add(db_challenge)
            db.commit()
            db.refresh(db_challenge)
            challenge_id = db_challenge.id
            
            # Créer le dossier pour les fichiers
            challenge_dir = get_challenge_dir(challenge_id)
            os.makedirs(challenge_dir, exist_ok=True)
            print(f"Dossier créé pour le challenge {challenge_id}: {challenge_dir}")
            
            print(f"Challenge sauvegardé en base de données avec l'ID: {db_challenge.id}")
            print(f"Ressources du challenge: {db_challenge.resources}")
            return db_challenge
        except Exception as e:
            print(f"Erreur lors de la création du challenge: {str(e)}")
            db.rollback()
            # Nettoyer le dossier si la création échoue
            if challenge_id:
                challenge_dir = get_challenge_dir(challenge_id)
                if os.path.exists(challenge_dir):
                    shutil.rmtree(challenge_dir)
            raise HTTPException(
                status_code=500,
                detail=f"Une erreur est survenue lors de la création du challenge: {str(e)}"
            )
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
        print(f"Tentative d'upload d'un fichier pour le challenge {challenge_id}")
        print(f"Nom du fichier: {file.filename}")
        print(f"Type de contenu: {file.content_type}")
        
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            print(f"Challenge {challenge_id} non trouvé")
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        print(f"Ressources actuelles du challenge: {challenge.resources}")
        
        # S'assurer que la structure des ressources est correcte
        resources = ensure_challenge_resources(challenge)
        
        # Valider le fichier
        validate_file(file)
        
        # Créer le dossier du challenge
        challenge_dir = get_challenge_dir(challenge_id)
        print(f"Création du dossier du challenge: {challenge_dir}")
        try:
            os.makedirs(challenge_dir, exist_ok=True)
        except Exception as e:
            print(f"Erreur lors de la création du dossier: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la création du dossier: {str(e)}")
        
        # Générer un nom de fichier unique
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(challenge_dir, filename)
        print(f"Chemin du fichier: {file_path}")
        
        # Sauvegarder le fichier
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"Fichier sauvegardé avec succès à {file_path}")
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du fichier: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde du fichier: {str(e)}")
        
        file_info = {
            'filename': filename,
            'original_name': file.filename,
            'uploaded_at': timestamp
        }
        
        # Vérifier si le fichier existe déjà
        existing_file = next(
            (f for f in resources['files'] if f['filename'] == filename),
            None
        )
        
        if existing_file:
            print(f"Le fichier existe déjà dans les ressources: {existing_file}")
            # Supprimer l'ancien fichier physique
            old_file_path = os.path.join(challenge_dir, existing_file['filename'])
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
            # Mettre à jour les informations du fichier
            existing_file.update(file_info)
        else:
            resources['files'].append(file_info)
        
        print(f"Ressources avant commit: {resources}")
        try:
            db.commit()
            db.refresh(challenge)
        except Exception as e:
            # Nettoyer le fichier en cas d'erreur de la base de données
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour de la base de données: {str(e)}")
        
        print(f"Fichier uploadé avec succès: {file_info}")
        return file_info
        
    except HTTPException as e:
        print(f"Erreur HTTP lors de l'upload du fichier: {str(e)}")
        raise e
    except Exception as e:
        print(f"Erreur inattendue lors de l'upload du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Une erreur inattendue est survenue: {str(e)}")

@router.get("/{challenge_id}/files/{filename}")
async def download_file(challenge_id: int, filename: str, db: Session = Depends(get_db)):
    try:
        print(f"Tentative de téléchargement du fichier {filename} pour le challenge {challenge_id}")
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            print(f"Challenge {challenge_id} non trouvé")
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        print(f"Ressources du challenge: {challenge.resources}")
        
        resources = ensure_challenge_resources(challenge)
        
        file_info = next(
            (f for f in resources['files'] if f['filename'] == filename),
            None
        )
        
        if not file_info:
            print(f"Fichier {filename} non trouvé dans les ressources du challenge {challenge_id}")
            print(f"Liste des fichiers disponibles: {[f['filename'] for f in resources['files']]}")
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Construire le chemin du fichier
        challenge_dir = get_challenge_dir(challenge_id)
        file_path = os.path.join(challenge_dir, filename)
        print(f"Chemin du fichier: {file_path}")
        
        if not os.path.exists(file_path):
            print(f"Le fichier n'existe pas à l'emplacement: {file_path}")
            raise HTTPException(status_code=404, detail="Le fichier n'existe pas sur le serveur")
        
        # Vérifier le type MIME du fichier
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        print(f"Type MIME du fichier: {content_type}")
        
        return FileResponse(
            file_path,
            filename=file_info['original_name'],
            media_type=content_type,
            headers={
                'Content-Disposition': f'attachment; filename="{file_info["original_name"]}"'
            }
        )
        
    except HTTPException as e:
        print(f"Erreur HTTP lors du téléchargement du fichier: {str(e)}")
        raise e
    except Exception as e:
        print(f"Erreur inattendue lors du téléchargement du fichier: {str(e)}")
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
        
        # Supprimer le fichier physique
        file_path = os.path.join(get_challenge_dir(challenge_id), filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            else:
                print(f"Avertissement: Le fichier {file_path} n'existe pas sur le disque")
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier {file_path}: {str(e)}")
            # On continue même si la suppression physique échoue
        
        # Mettre à jour les ressources
        challenge.resources['files'] = [
            f for f in challenge.resources['files'] 
            if f['filename'] != filename
        ]
        
        # Si le dossier du challenge est vide, le supprimer
        challenge_dir = get_challenge_dir(challenge_id)
        try:
            if os.path.exists(challenge_dir) and not os.listdir(challenge_dir):
                os.rmdir(challenge_dir)
        except Exception as e:
            print(f"Erreur lors de la suppression du dossier vide {challenge_dir}: {str(e)}")
        
        db.commit()
        return {"message": "Fichier supprimé avec succès"}
        
    except Exception as e:
        print(f"Erreur lors de la suppression du fichier: {str(e)}")
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
async def delete_challenge(challenge_id: int, db: Session = Depends(get_db)):
    try:
        challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        # Supprimer le dossier des fichiers du challenge
        challenge_dir = get_challenge_dir(challenge_id)
        if os.path.exists(challenge_dir):
            try:
                shutil.rmtree(challenge_dir)
            except Exception as e:
                print(f"Erreur lors de la suppression du dossier {challenge_dir}: {str(e)}")
        
        db.delete(challenge)
        db.commit()
        return {"message": "Challenge supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{challenge_id}", response_model=schemas.Challenge)
def update_challenge(challenge_id: int, challenge: schemas.ChallengeCreate, db: Session = Depends(get_db)):
    try:
        print(f"Tentative de mise à jour du challenge {challenge_id}")
        db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
        if db_challenge is None:
            raise HTTPException(status_code=404, detail="Challenge non trouvé")
        
        # Sauvegarder les ressources existantes
        existing_resources = db_challenge.resources or {}
        print(f"Ressources existantes: {existing_resources}")
        
        # Mettre à jour les champs
        challenge_data = challenge.dict(exclude_unset=True)
        print(f"Données de mise à jour: {challenge_data}")
        
        # Préserver les ressources existantes si elles ne sont pas dans les données de mise à jour
        if 'resources' not in challenge_data:
            challenge_data['resources'] = existing_resources
        else:
            # Fusionner les ressources existantes avec les nouvelles
            if not challenge_data['resources']:
                challenge_data['resources'] = existing_resources
            else:
                # Préserver les fichiers existants
                if 'files' in existing_resources and 'files' not in challenge_data['resources']:
                    challenge_data['resources']['files'] = existing_resources['files']
                # Préserver les liens existants
                if 'links' in existing_resources and 'links' not in challenge_data['resources']:
                    challenge_data['resources']['links'] = existing_resources['links']
                # Préserver les commandes existantes
                if 'commands' in existing_resources and 'commands' not in challenge_data['resources']:
                    challenge_data['resources']['commands'] = existing_resources['commands']
        
        print(f"Données finales pour la mise à jour: {challenge_data}")
        
        for key, value in challenge_data.items():
            setattr(db_challenge, key, value)
        
        db.commit()
        db.refresh(db_challenge)
        print(f"Challenge mis à jour avec succès. Nouvelles ressources: {db_challenge.resources}")
        return db_challenge
    except Exception as e:
        print(f"Erreur lors de la mise à jour du challenge: {str(e)}")
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