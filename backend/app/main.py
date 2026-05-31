from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.db.session import engine
from app.db.base import Base
from app.api.routes import auth, movies, reviews, recommendations
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Preload dataset in background so first requests aren't slow
    print("Preloading movie dataset...", flush=True)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _preload_all)
    print("Startup complete — ready to serve requests", flush=True)

    yield


def _preload_all():
    from app.data.loader import preload
    preload()


app = FastAPI(
    title="CineMatch API",
    description="AI-powered movie review and recommendation platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",            tags=["auth"])
app.include_router(movies.router,          prefix="/api/movies",          tags=["movies"])
app.include_router(reviews.router,         prefix="/api/reviews",         tags=["reviews"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])


@app.get("/")
def root():
    return {"message": "CineMatch API v2"}


@app.get("/health")
def health():
    from app.data.loader import _df
    return {"status": "ok", "movies_loaded": _df is not None and len(_df) > 0}
