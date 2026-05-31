from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.ml.recommender import rec_engine
from app.services.tmdb import tmdb
from app.services.ollama_service import ollama_service

router = APIRouter()


@router.get("/for-me")
def get_personalized(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec_engine.train(db)
    movie_ids = rec_engine.get_recommendations_for_user(current_user.id, db, n=24)
    if not movie_ids:
        data = tmdb.get_popular()
        return {"movies": data["results"][:24], "source": "popular",
                "message": "Rate some movies to get personalized picks!"}
    movies = tmdb.get_movies_by_ids(movie_ids[:24])
    return {"movies": movies, "source": "collaborative_filtering", "message": "Based on your taste"}


@router.post("/ai-search")
def ai_search(query: str = Query(..., min_length=3)):
    parsed = ollama_service.parse_query(query)
    results = []
    seen_ids = set()

    def add(movies, limit=20):
        for m in movies:
            if m["id"] not in seen_ids and len(results) < limit:
                results.append(m)
                seen_ids.add(m["id"])

    genre_names = parsed.get("genres", [])
    keywords    = parsed.get("keywords", [])
    min_year    = parsed.get("min_year")
    max_year    = parsed.get("max_year")
    ref_movie   = parsed.get("reference_movie")

    # 1. Reference movie → find it, get its keywords + similar films
    ref_keywords = []
    if ref_movie:
        search = tmdb.search_movies(ref_movie, page_size=3)
        if search["results"]:
            ref = search["results"][0]
            full = tmdb.get_movie(ref["id"])
            if full:
                ref_keywords = full.get("keywords", [])[:8]
                add(full.get("similar", [])[:10])

                # CF-based similar
                from app.db.session import SessionLocal
                db_tmp = SessionLocal()
                try:
                    cf_ids = rec_engine.get_similar_users_liked(ref["id"], db_tmp, n=8)
                    add(tmdb.get_movies_by_ids(cf_ids))
                finally:
                    db_tmp.close()

    # 2. Genre discovery with AND logic (must match ALL extracted genres)
    if genre_names and len(results) < 20:
        genre_results = tmdb.discover_by_genres(
            genre_names, page_size=30,
            min_year=min_year, max_year=max_year,
            require_all=True,
        )
        add(genre_results["results"])

    # 3. Keyword search combining extracted + reference keywords
    all_keywords = list(set(keywords + ref_keywords))
    if all_keywords and len(results) < 20:
        kw_results = tmdb.discover_by_keywords(
            all_keywords, page_size=20,
            min_year=min_year, max_year=max_year,
        )
        add(kw_results["results"])

    # 4. Mood fallback if still thin
    if len(results) < 10 and parsed.get("mood"):
        mood_genres = {
            "funny":            ["Comedy"],
            "dark":             ["Thriller", "Crime"],
            "exciting":         ["Action", "Adventure"],
            "emotional":        ["Drama", "Romance"],
            "scary":            ["Horror"],
            "thought-provoking":["Science Fiction", "Drama"],
            "inspiring":        ["Drama"],
            "romantic":         ["Romance"],
            "lighthearted":     ["Comedy", "Family"],
            "tense":            ["Thriller"],
        }
        fallback_genres = mood_genres.get(parsed["mood"].lower(), ["Drama"])
        r = tmdb.discover_by_genres(fallback_genres, page_size=20,
                                     min_year=min_year, max_year=max_year)
        add(r["results"])

    # 5. Plain text fallback
    if not results:
        add(tmdb.search_movies(query, page_size=20)["results"])

    final = results[:20]

    # AI explanations for top 5 only
    for movie in final[:5]:
        movie["ai_explanation"] = ollama_service.generate_explanation(
            movie["title"], query, parsed.get("mood", "")
        )

    return {"movies": final, "parsed_query": parsed, "source": "ai_search"}


@router.get("/similar/{movie_id}")
def get_similar(movie_id: int, db: Session = Depends(get_db)):
    movie = tmdb.get_movie(movie_id)
    if not movie:
        return {"movies": []}
    similar = list(movie.get("similar", []))
    cf_ids = rec_engine.get_similar_users_liked(movie_id, db, n=8)
    cf_movies = tmdb.get_movies_by_ids(cf_ids)
    existing = {m["id"] for m in similar}
    for m in cf_movies:
        if m["id"] not in existing:
            similar.append(m)
    return {"movies": similar[:16]}


@router.post("/train")
def trigger_training(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = rec_engine.train(db)
    return {"trained": success, "message": "Model updated" if success else "Not enough data"}
