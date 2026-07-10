from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from . import models
from .seed import main as seed_database
from .routers import courses, lessons, users, auth

# Create tables
Base.metadata.create_all(bind=engine)

# Seed database only if empty
db = SessionLocal()
if db.query(models.User).count() == 0:
    db.close()
    seed_database()
else:
    db.close()

app = FastAPI(title="Duolingo Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://duolingo-26bg.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}