# PwnBox - Plateforme d'Entraînement CTF

PwnBox est une application personnelle pour l'entraînement aux CTFs (Capture The Flag). Elle permet de gérer vos outils, challenges et progression dans le domaine de la sécurité informatique.

## Fonctionnalités

- 🛠 Gestion des outils par catégorie (web, forensic, crypto, etc.)
- 🎯 Suivi des challenges CTF
- 📝 Création de writeups
- 🔍 Analyse automatique de fichiers
- ✅ Vérification des flags
- 📊 Suivi de progression

## Installation

1. Cloner le repository :
```bash
git clone https://github.com/votre-username/pwnbox.git
cd pwnbox
```

2. Créer un environnement virtuel Python :
```bash
python -m venv venv
.\venv\Scripts\activate   # Windows
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

## Démarrage

1. Lancer le backend :
```bash
cd backend
uvicorn main:app --reload
```

2. Le serveur démarre sur http://localhost:8000

## Documentation API

La documentation de l'API est disponible aux endpoints suivants :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

## Structure du Projet

```
pwnbox/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── schemas.py
├── requirements.txt
└── README.md
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request. 