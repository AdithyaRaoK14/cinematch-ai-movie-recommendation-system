import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, Clock, Calendar, Users } from 'lucide-react'
import api from '../lib/api'
import ReviewForm from '../components/review/ReviewForm'
import ReviewList from '../components/review/ReviewList'
import MovieGrid from '../components/movie/MovieGrid'
import StarRating from '../components/ui/StarRating'
import useAuthStore from '../store/authStore'

export default function MovieDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => api.get(`/movies/${id}`).then((r) => r.data),
  })

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.get(`/reviews/movie/${id}`).then((r) => r.data),
  })

  const { data: similar } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => api.get(`/recommendations/similar/${id}`).then((r) => r.data),
  })

  const existingReview = reviews?.find((r) => r.user_id === user?.id)
  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (isLoading) return <div className="page-loader"><div className="spinner" /></div>
  if (!movie) return <div className="container" style={{ paddingTop: '40px' }}>Movie not found</div>

  return (
    <div>
      {/* Backdrop */}
      <div style={{ position: 'relative', height: '420px', overflow: 'hidden' }}>
        {movie.backdrop_path ? (
          <img src={movie.backdrop_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 30%, transparent)' }} />
      </div>

      <div className="container" style={{ marginTop: '-180px', position: 'relative', paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Poster */}
          <div style={{
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            flexShrink: 0,
          }}>
            {movie.poster_path ? (
              <img src={movie.poster_path} alt={movie.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No Image
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ paddingTop: '80px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              letterSpacing: '0.04em',
              lineHeight: '1.1',
              marginBottom: '12px',
            }}>
              {movie.title}
            </h1>

            {/* Meta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {movie.release_date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {movie.release_date.split('-')[0]}
                </span>
              )}
              {movie.runtime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {movie.vote_average && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                  <Star size={13} fill="currentColor" /> {movie.vote_average.toFixed(1)} TMDB
                </span>
              )}
              {avgRating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                  <Users size={13} /> {avgRating} User avg
                </span>
              )}
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {movie.genres?.map((g) => (
                <span key={g} className="badge badge-muted">{g}</span>
              ))}
            </div>

            {/* Overview */}
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', maxWidth: '640px', marginBottom: '24px' }}>
              {movie.overview}
            </p>

            {/* Director */}
            {movie.director && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Director: </span>
                {movie.director}
              </p>
            )}
          </div>
        </div>

        {/* Cast */}
        {movie.cast?.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>CAST</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {movie.cast.slice(0, 8).map((c) => (
                <div key={c.name} style={{ flexShrink: 0, width: '90px', textAlign: 'center' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    overflow: 'hidden', margin: '0 auto 8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}>
                    {c.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                        alt={c.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                        👤
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>{c.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section style={{ marginTop: '48px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            REVIEWS {reviews?.length > 0 && `(${reviews.length})`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
            <ReviewForm
              movie={movie}
              existingReview={existingReview}
              onSuccess={() => {
                refetchReviews()
                queryClient.invalidateQueries(['recommended'])
              }}
            />
            <ReviewList reviews={reviews} onRefresh={refetchReviews} />
          </div>
        </section>

        {/* Similar movies */}
        {similar?.movies?.length > 0 && (
          <section style={{ marginTop: '56px' }}>
            <h2 className="section-title" style={{ marginBottom: '24px' }}>MORE LIKE THIS</h2>
            <MovieGrid movies={similar.movies} />
          </section>
        )}
      </div>
    </div>
  )
}
