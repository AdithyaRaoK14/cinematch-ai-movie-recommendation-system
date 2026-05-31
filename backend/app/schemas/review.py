from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    tmdb_movie_id: int
    movie_title: str
    rating: float = Field(..., ge=0.5, le=5.0)
    content: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=0.5, le=5.0)
    content: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    user_id: int
    username: str
    tmdb_movie_id: int
    movie_title: str
    rating: float
    content: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
