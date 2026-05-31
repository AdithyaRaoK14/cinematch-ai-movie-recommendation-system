import os
import pickle
import numpy as np
import pandas as pd
from typing import Optional
from sqlalchemy.orm import Session
from sklearn.decomposition import TruncatedSVD

from app.models.review import Review

MODEL_PATH   = "/app/ml_models/svd_model.pkl"
RATINGS_CSV  = "/app/app/data/ratings_small.csv"
LINKS_CSV    = "/app/app/data/links_small.csv"


class RecommendationEngine:
    def __init__(self):
        self.model: Optional[TruncatedSVD] = None
        self.user_ids: list = []
        self.movie_ids: list = []
        self.user_movie_matrix: Optional[np.ndarray] = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                data = pickle.load(f)
                self.model = data["model"]
                self.user_ids = data["user_ids"]
                self.movie_ids = data["movie_ids"]
                self.user_movie_matrix = data["matrix"]

    def _save_model(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "model": self.model,
                "user_ids": self.user_ids,
                "movie_ids": self.movie_ids,
                "matrix": self.user_movie_matrix,
            }, f)

    def _build_matrix_from_df(self, df: pd.DataFrame):
        self.user_ids = df["user_id"].unique().tolist()
        self.movie_ids = df["movie_id"].unique().tolist()
        user_idx = {u: i for i, u in enumerate(self.user_ids)}
        movie_idx = {m: i for i, m in enumerate(self.movie_ids)}
        matrix = np.zeros((len(self.user_ids), len(self.movie_ids)))
        for _, row in df.iterrows():
            matrix[user_idx[row["user_id"]], movie_idx[row["movie_id"]]] = row["rating"]
        return matrix

    def train(self, db: Session) -> bool:
        """Train using ratings_small.csv (real data) + any user reviews in DB."""
        rows = []

        # Load real ratings from CSV if available
        if os.path.exists(RATINGS_CSV) and os.path.exists(LINKS_CSV):
            try:
                ratings = pd.read_csv(RATINGS_CSV)
                links = pd.read_csv(LINKS_CSV)
                # Map movieId → tmdbId
                links = links.dropna(subset=["tmdbId"])
                links["tmdbId"] = links["tmdbId"].astype(int)
                merged = ratings.merge(links[["movieId", "tmdbId"]], on="movieId", how="inner")
                # Use negative user IDs for CSV users to avoid collision with DB users
                for _, r in merged.iterrows():
                    rows.append({
                        "user_id": int(r["userId"]) * -1,
                        "movie_id": int(r["tmdbId"]),
                        "rating": float(r["rating"]) * 2,  # scale 1-5 → 2-10 → keep as 0.5-5 range
                    })
                print(f"Loaded {len(rows)} ratings from CSV")
            except Exception as e:
                print(f"CSV ratings load error: {e}")

        # Add DB reviews
        db_reviews = db.query(Review).all()
        for r in db_reviews:
            rows.append({"user_id": r.user_id, "movie_id": r.tmdb_movie_id, "rating": r.rating})

        if len(rows) < 20:
            return False

        df = pd.DataFrame(rows)
        # Normalize ratings to 0.5–5 range
        df["rating"] = df["rating"].clip(0.5, 5.0)

        self.user_movie_matrix = self._build_matrix_from_df(df)

        n_components = min(50, len(self.user_ids) - 1, len(self.movie_ids) - 1)
        if n_components < 2:
            return False

        self.model = TruncatedSVD(n_components=n_components, random_state=42)
        self.model.fit(self.user_movie_matrix)
        self._save_model()
        print(f"Model trained: {len(self.user_ids)} users, {len(self.movie_ids)} movies")
        return True

    def get_recommendations_for_user(self, user_id: int, db: Session, n: int = 20) -> list:
        if self.model is None or user_id not in self.user_ids:
            # Fallback: return top rated movies from CSV data
            return self.get_popular_movie_ids(n)

        rated_ids = {r.tmdb_movie_id for r in db.query(Review).filter(Review.user_id == user_id).all()}
        ui = self.user_ids.index(user_id)
        latent = self.model.transform(self.user_movie_matrix[ui:ui+1])
        reconstructed = self.model.inverse_transform(latent)[0]

        scored = [
            (self.movie_ids[i], reconstructed[i])
            for i in range(len(self.movie_ids))
            if self.movie_ids[i] not in rated_ids
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [mid for mid, _ in scored[:n]]

    def get_popular_movie_ids(self, n: int = 20) -> list:
        """Return most-rated movie IDs from the training data."""
        if not self.movie_ids:
            return []
        if self.user_movie_matrix is not None:
            # Sum of ratings per movie = proxy for popularity
            sums = self.user_movie_matrix.sum(axis=0)
            top_indices = np.argsort(sums)[::-1][:n]
            return [self.movie_ids[i] for i in top_indices]
        return self.movie_ids[:n]

    def get_similar_users_liked(self, movie_id: int, db: Session, n: int = 10) -> list:
        if self.model is None or movie_id not in self.movie_ids:
            return []
        mi = self.movie_ids.index(movie_id)
        movie_col = self.user_movie_matrix[:, mi]
        good_users = [i for i, r in enumerate(movie_col) if r >= 3.5]
        if not good_users:
            return []
        related = {}
        for ui in good_users:
            for mi2, rating in enumerate(self.user_movie_matrix[ui]):
                if mi2 != mi and rating >= 3.5:
                    mid = self.movie_ids[mi2]
                    related[mid] = related.get(mid, 0) + 1
        sorted_movies = sorted(related.items(), key=lambda x: x[1], reverse=True)
        return [mid for mid, _ in sorted_movies[:n]]


rec_engine = RecommendationEngine()
