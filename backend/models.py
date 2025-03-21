from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Table
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
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(20))
    status = Column(String(20))  # not_started, in_progress, completed
    source = Column(String(500))
    flag_pattern = Column(String(200))  # Regex pattern ou flag exact
    notes = Column(Text)
    writeup = Column(Text)
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