import pandas as pd
import ast
import os
import threading

DATA_DIR     = os.path.dirname(__file__)
MOVIES_CSV   = os.path.join(DATA_DIR, "movies_metadata.csv")
CREDITS_CSV  = os.path.join(DATA_DIR, "credits.csv")
KEYWORDS_CSV = os.path.join(DATA_DIR, "keywords.csv")

_df: pd.DataFrame = None
_lock = threading.Lock()


def safe_parse(val):
    try:
        return ast.literal_eval(val)
    except Exception:
        return []


def load_movies() -> pd.DataFrame:
    print("Loading movies_metadata.csv...", flush=True)
    movies = pd.read_csv(MOVIES_CSV, low_memory=False)
    movies = movies[pd.to_numeric(movies["id"], errors="coerce").notna()]
    movies["id"] = movies["id"].astype(int)

    if os.path.exists(KEYWORDS_CSV):
        print("Loading keywords.csv...", flush=True)
        kw = pd.read_csv(KEYWORDS_CSV)
        kw["id"] = pd.to_numeric(kw["id"], errors="coerce")
        kw = kw.dropna(subset=["id"]).copy()
        kw["id"] = kw["id"].astype(int)
        movies = movies.merge(kw, on="id", how="left")

    if os.path.exists(CREDITS_CSV):
        print("Loading credits.csv...", flush=True)
        credits = pd.read_csv(CREDITS_CSV)
        credits["id"] = pd.to_numeric(credits["id"], errors="coerce")
        credits = credits.dropna(subset=["id"]).copy()
        credits["id"] = credits["id"].astype(int)
        movies = movies.merge(credits, on="id", how="left")

    print("Parsing metadata...", flush=True)
    movies["genres_parsed"]   = movies["genres"].apply(safe_parse)   if "genres"   in movies.columns else [[]] * len(movies)
    movies["keywords_parsed"] = movies["keywords"].apply(safe_parse) if "keywords" in movies.columns else [[]] * len(movies)
    movies["cast_parsed"]     = movies["cast"].apply(safe_parse)     if "cast"     in movies.columns else [[]] * len(movies)
    movies["crew_parsed"]     = movies["crew"].apply(safe_parse)     if "crew"     in movies.columns else [[]] * len(movies)

    movies["genre_names"]   = movies["genres_parsed"].apply(lambda x: [g["name"] for g in x if isinstance(g, dict)])
    movies["keyword_names"] = movies["keywords_parsed"].apply(lambda x: [k["name"] for k in x if isinstance(k, dict)])
    movies["cast_names"]    = movies["cast_parsed"].apply(
        lambda x: [{"name": c["name"], "character": c.get("character", ""), "profile_path": c.get("profile_path")}
                   for c in x[:10] if isinstance(c, dict)]
    )
    movies["director"] = movies["crew_parsed"].apply(
        lambda x: next((c["name"] for c in x if isinstance(c, dict) and c.get("job") == "Director"), None)
    )

    movies["poster_path"] = movies["poster_path"].apply(
        lambda x: f"https://image.tmdb.org/t/p/w500{x}" if pd.notna(x) and str(x).startswith("/") else None
    ) if "poster_path" in movies.columns else None

    movies["backdrop_path"] = movies["backdrop_path"].apply(
        lambda x: f"https://image.tmdb.org/t/p/w1280{x}" if pd.notna(x) and str(x).startswith("/") else None
    ) if "backdrop_path" in movies.columns else None

    movies["vote_average"] = pd.to_numeric(movies["vote_average"], errors="coerce").fillna(0)
    movies["vote_count"]   = pd.to_numeric(movies["vote_count"],   errors="coerce").fillna(0).astype(int)
    movies["popularity"]   = pd.to_numeric(movies["popularity"],   errors="coerce").fillna(0)
    movies["runtime"]      = pd.to_numeric(movies["runtime"],      errors="coerce")
    movies["release_date"] = movies["release_date"].fillna("").astype(str)
    movies["year"]         = movies["release_date"].apply(lambda x: int(x[:4]) if len(x) >= 4 and x[:4].isdigit() else 0)

    movies = movies.dropna(subset=["title"])
    movies = movies[movies["vote_count"] >= 20]
    movies = movies[movies["title"].str.strip() != ""]

    # Drop parsing helper columns to save memory
    movies = movies.drop(columns=["genres_parsed", "keywords_parsed", "cast_parsed", "crew_parsed"], errors="ignore")

    print(f"✓ Dataset ready: {len(movies)} movies loaded", flush=True)
    return movies.reset_index(drop=True)


def format_movie(row) -> dict:
    return {
        "id":           int(row["id"]),
        "title":        row.get("title", "Unknown"),
        "overview":     row.get("overview", ""),
        "poster_path":  row.get("poster_path"),
        "backdrop_path":row.get("backdrop_path"),
        "release_date": str(row.get("release_date", ""))[:10],
        "year":         int(row.get("year", 0)),
        "vote_average": round(float(row.get("vote_average", 0)), 1),
        "vote_count":   int(row.get("vote_count", 0)),
        "genres":       row.get("genre_names", []),
        "keywords":     row.get("keyword_names", [])[:10],
        "cast":         row.get("cast_names", []),
        "director":     row.get("director"),
        "runtime":      int(row["runtime"]) if pd.notna(row.get("runtime")) else None,
        "popularity":   float(row.get("popularity", 0)),
        "tagline":      row.get("tagline", "") if pd.notna(row.get("tagline", None)) else "",
        "similar":      [],
    }


def get_df() -> pd.DataFrame:
    """Thread-safe singleton — loads once, reuses forever."""
    global _df
    if _df is not None:
        return _df
    with _lock:
        if _df is None:   # double-check inside lock
            _df = load_movies()
    return _df


def preload():
    """Call this at startup to load data before any requests come in."""
    get_df()
