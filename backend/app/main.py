from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import courses, lessons, users, auth

# Dev convenience: create tables if they don't exist. In a real project
# use Alembic migrations instead of create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Duolingo Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
