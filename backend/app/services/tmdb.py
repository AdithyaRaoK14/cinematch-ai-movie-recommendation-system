import pandas as pd
import numpy as np
from typing import Optional
from app.data.loader import get_df, format_movie

GENRE_ID_MAP = {
    "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35,
    "Crime": 80, "Documentary": 99, "Drama": 18, "Family": 10751,
    "Fantasy": 14, "History": 36, "Horror": 27, "Music": 10402,
    "Mystery": 9648, "Romance": 10749, "Science Fiction": 878,
    "Thriller": 53, "War": 10752, "Western": 37,
}
GENRE_NAME_MAP = {v: k for k, v in GENRE_ID_MAP.items()}


def weighted_score(df: pd.DataFrame, m: int = 200) -> pd.Series:
    """IMDB-style weighted rating: WR = (v/(v+m)) * R + (m/(v+m)) * C"""
    C = df["vote_average"].mean()
    v = df["vote_count"]
    R = df["vote_average"]
    return (v / (v + m)) * R + (m / (v + m)) * C


class MovieService:

    def search_movies(self, query: str, page: int = 1, page_size: int = 24,
                      genre: str = None, min_year: int = None, max_year: int = None,
                      min_rating: float = None) -> dict:
        df = get_df()
        q = query.lower().strip()
        if q:
            mask = (
                df["title"].str.lower().str.contains(q, na=False) |
                df["overview"].str.lower().str.contains(q, na=False) |
                df["keyword_names"].apply(lambda ks: any(q in k.lower() for k in ks))
            )
            df = df[mask]
        df = self._apply_filters(df, genre, min_year, max_year, min_rating)
        df = df.copy()
        df["_score"] = weighted_score(df)
        df = df.sort_values("_score", ascending=False)
        total = len(df)
        start = (page - 1) * page_size
        return {
            "results": [format_movie(r) for _, r in df.iloc[start:start + page_size].iterrows()],
            "total_pages": max(1, (total + page_size - 1) // page_size),
            "total_results": total,
        }

    def get_movie(self, movie_id: int) -> Optional[dict]:
        df = get_df()
        row = df[df["id"] == movie_id]
        if row.empty:
            return None
        movie = format_movie(row.iloc[0])
        movie["similar"] = self._get_similar(movie_id, row.iloc[0])
        return movie

    def get_trending(self, page: int = 1, page_size: int = 24) -> dict:
        df = get_df()
        df = df[df["vote_count"] >= 500].copy()
        # Trending = popularity-weighted
        df["_score"] = df["popularity"] * 0.6 + df["vote_average"] * 10 * 0.4
        df = df.sort_values("_score", ascending=False)
        start = (page - 1) * page_size
        return {
            "results": [format_movie(r) for _, r in df.iloc[start:start + page_size].iterrows()],
            "total_pages": max(1, len(df) // page_size),
        }

    def get_popular(self, page: int = 1, page_size: int = 24) -> dict:
        df = get_df()
        df = df[df["vote_count"] >= 500].copy()
        df["_score"] = weighted_score(df)
        df = df.sort_values("_score", ascending=False)
        start = (page - 1) * page_size
        return {
            "results": [format_movie(r) for _, r in df.iloc[start:start + page_size].iterrows()],
            "total_pages": max(1, len(df) // page_size),
        }

    def get_by_genre(self, genre_name: str, page: int = 1, page_size: int = 24) -> dict:
        df = get_df()
        mask = df["genre_names"].apply(lambda gs: any(g.lower() == genre_name.lower() for g in gs))
        df = df[mask & (df["vote_count"] >= 200)].copy()
        df["_score"] = weighted_score(df)
        df = df.sort_values("_score", ascending=False)
        start = (page - 1) * page_size
        return {
            "results": [format_movie(r) for _, r in df.iloc[start:start + page_size].iterrows()],
            "total_pages": max(1, len(df) // page_size),
            "total_results": len(df),
        }

    def discover_by_genres(self, genre_names: list[str], page_size: int = 24,
                            min_year: int = None, max_year: int = None,
                            require_all: bool = True) -> dict:
        """Multi-genre discovery. require_all=True means AND logic (must match all genres)."""
        df = get_df()
        genre_names_lower = [g.lower() for g in genre_names if g]

        if not genre_names_lower:
            return {"results": []}

        def match_all(gs):
            gs_lower = [g.lower() for g in gs]
            return all(g in gs_lower for g in genre_names_lower)

        def match_any(gs):
            gs_lower = [g.lower() for g in gs]
            return any(g in gs_lower for g in genre_names_lower)

        # Try AND first
        mask = df["genre_names"].apply(match_all)
        filtered = df[mask & (df["vote_count"] >= 100)]

        # Fall back to OR if AND gives too few results
        if len(filtered) < 10 and require_all:
            mask = df["genre_names"].apply(match_any)
            filtered = df[mask & (df["vote_count"] >= 100)]

        filtered = filtered.copy()
        if min_year:
            filtered = filtered[filtered["year"] >= min_year]
        if max_year:
            filtered = filtered[filtered["year"] <= max_year]

        if filtered.empty:
            return {"results": []}

        filtered["_score"] = weighted_score(filtered)
        filtered = filtered.sort_values("_score", ascending=False)
        return {
            "results": [format_movie(r) for _, r in filtered.iloc[:page_size].iterrows()],
        }

    def discover_by_genre(self, genre_ids: list, page: int = 1, page_size: int = 24,
                          min_year: int = None, max_year: int = None) -> dict:
        genre_names = [GENRE_NAME_MAP[gid] for gid in genre_ids if gid in GENRE_NAME_MAP]
        return self.discover_by_genres(genre_names, page_size, min_year, max_year)

    def discover_by_keywords(self, keywords: list[str], page_size: int = 24,
                              min_year: int = None, max_year: int = None) -> dict:
        df = get_df()
        kw_lower = [k.lower() for k in keywords]

        def has_keyword(kws):
            kws_lower = [k.lower() for k in kws]
            return any(k in kws_lower for k in kw_lower)

        mask = df["keyword_names"].apply(has_keyword)
        filtered = df[mask & (df["vote_count"] >= 50)].copy()
        if min_year:
            filtered = filtered[filtered["year"] >= min_year]
        if max_year:
            filtered = filtered[filtered["year"] <= max_year]

        if filtered.empty:
            return {"results": []}

        filtered["_score"] = weighted_score(filtered)
        filtered = filtered.sort_values("_score", ascending=False)
        return {"results": [format_movie(r) for _, r in filtered.iloc[:page_size].iterrows()]}

    def get_movies_by_ids(self, ids: list) -> list:
        df = get_df()
        results = []
        for mid in ids:
            row = df[df["id"] == mid]
            if not row.empty:
                results.append(format_movie(row.iloc[0]))
        return results

    def get_all_genres(self) -> list:
        df = get_df()
        genres = set()
        for gs in df["genre_names"]:
            genres.update(gs)
        return sorted([g for g in genres if g])

    def _apply_filters(self, df, genre=None, min_year=None, max_year=None, min_rating=None):
        if genre:
            df = df[df["genre_names"].apply(lambda gs: any(g.lower() == genre.lower() for g in gs))]
        if min_year:
            df = df[df["year"] >= min_year]
        if max_year:
            df = df[df["year"] <= max_year]
        if min_rating:
            df = df[df["vote_average"] >= min_rating]
        return df

    def _get_similar(self, movie_id: int, row, n: int = 16) -> list:
        df = get_df()
        genres = set(row["genre_names"])
        keywords = set(row["keyword_names"][:15])
        director = row.get("director")

        def score(r):
            if r["id"] == movie_id:
                return -1
            g_overlap = len(genres & set(r["genre_names"]))
            k_overlap = len(keywords & set(r["keyword_names"]))
            d_bonus = 2 if r.get("director") == director and director else 0
            return g_overlap * 3 + k_overlap + d_bonus

        df = df.copy()
        df["_score"] = df.apply(score, axis=1)
        similar = df[(df["_score"] > 0) & (df["vote_count"] >= 100)].copy()
        similar["_wscore"] = weighted_score(similar)
        similar["_final"] = similar["_score"] * 0.6 + similar["_wscore"] * 0.4
        similar = similar.sort_values("_final", ascending=False).head(n)
        return [format_movie(r) for _, r in similar.iterrows()]


tmdb = MovieService()
