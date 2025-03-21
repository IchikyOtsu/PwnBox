from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import uvicorn
from . import models
from .database import engine
from .routes import tools, challenges

# Créer les tables dans la base de données
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PwnBox - CTF Training Platform")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(tools.router)
app.include_router(challenges.router)

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur PwnBox - Votre plateforme d'entraînement CTF",
        "version": "1.0.0",
        "endpoints": {
            "tools": "/tools",
            "challenges": "/challenges"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 