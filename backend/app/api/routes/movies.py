from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.tmdb import tmdb

router = APIRouter()


@router.get("/search")
def search_movies(
    q: str = Query(default=""),
    page: int = 1,
    genre: Optional[str] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    min_rating: Optional[float] = None,
):
    return tmdb.search_movies(q, page, genre=genre, min_year=min_year,
                              max_year=max_year, min_rating=min_rating)


@router.get("/trending")
def get_trending(page: int = 1):
    return tmdb.get_trending(page)


@router.get("/popular")
def get_popular(page: int = 1):
    return tmdb.get_popular(page)


@router.get("/genre/{genre_name}")
def get_by_genre(genre_name: str, page: int = 1):
    return tmdb.get_by_genre(genre_name, page)


@router.get("/genres")
def get_genres():
    return {"genres": tmdb.get_all_genres()}


@router.get("/{movie_id}")
def get_movie(movie_id: int):
    movie = tmdb.get_movie(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie
