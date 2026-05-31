from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewOut
from app.core.security import get_current_user

router = APIRouter()


def _review_to_out(r: Review, db: Session) -> ReviewOut:
    user = db.query(User).filter(User.id == r.user_id).first()
    return ReviewOut(
        id=r.id,
        user_id=r.user_id,
        username=user.username if user else "unknown",
        tmdb_movie_id=r.tmdb_movie_id,
        movie_title=r.movie_title,
        rating=r.rating,
        content=r.content,
        created_at=r.created_at,
    )


@router.post("/", response_model=ReviewOut)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.tmdb_movie_id == data.tmdb_movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this movie")

    review = Review(
        user_id=current_user.id,
        tmdb_movie_id=data.tmdb_movie_id,
        movie_title=data.movie_title,
        rating=data.rating,
        content=data.content,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _review_to_out(review, db)


@router.get("/movie/{movie_id}", response_model=List[ReviewOut])
def get_movie_reviews(movie_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.tmdb_movie_id == movie_id).all()
    return [_review_to_out(r, db) for r in reviews]


@router.get("/user/me", response_model=List[ReviewOut])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
    return [_review_to_out(r, db) for r in reviews]


@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    if data.rating is not None:
        review.rating = data.rating
    if data.content is not None:
        review.content = data.content
    db.commit()
    db.refresh(review)
    return _review_to_out(review, db)


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your review")
    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}
