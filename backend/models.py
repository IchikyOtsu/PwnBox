from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Tool(Base):
    __tablename__ = "tools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # web, forensic, crypto, etc.
    description = Column(Text)
    command = Column(String(500))
    url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(20))
    solved = Column(Boolean, default=False)
    correct_flag = Column(String(200))  # Flag correct pour la validation
    resources = Column(JSON)  # Pour stocker les liens, commandes, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    name = Column(String(200), nullable=False)
    path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    analysis_results = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    challenge = relationship("Challenge", back_populates="files")

Challenge.files = relationship("File", back_populates="challenge") 