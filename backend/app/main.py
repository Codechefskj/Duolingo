from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from . import models
from .routers import courses, lessons, users, auth
from .seed import main as seed_database

Base.metadata.create_all(bind=engine)

# Seed only if database is empty
db = SessionLocal()
if db.query(models.User).count() == 0:
    seed_database()
db.close()

app = FastAPI(title="Duolingo Clone API", version="1.0.0")