import { Link } from 'react-router-dom'
import { Star, Calendar } from 'lucide-react'

export default function MovieCard({ movie, aiExplanation }) {
  const year = movie.release_date?.split('-')[0]
  const rating = movie.vote_average?.toFixed(1)

  return (
    <Link to={`/movie/${movie.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card"
        style={{
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)'
          e.currentTarget.style.borderColor = 'var(--border-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        {/* Poster */}
        <div style={{ position: 'relative', aspectRatio: '2/3', background: 'var(--bg-elevated)' }}>
          {movie.poster_path ? (
            <img
              src={movie.poster_path}
              alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.querySelector('.poster-fallback').style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="poster-fallback"
            style={{
              width: '100%', height: '100%',
              display: movie.poster_path ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))',
              color: 'var(--text-muted)',
              gap: '8px', padding: '16px', textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '32px' }}>🎬</span>
            <span style={{ fontSize: '11px', lineHeight: '1.4', opacity: 0.7 }}>{movie.title}</span>
          </div>

          {/* Rating badge */}
          {rating && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(10,10,15,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: '600',
              color: 'var(--accent)',
            }}>
              <Star size={11} fill="currentColor" />
              {rating}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <h3 style={{
            fontSize: '14px', fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {movie.title}
          </h3>

          {year && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <Calendar size={11} />
              {year}
            </div>
          )}

          {/* AI explanation if provided */}
          {aiExplanation && (
            <div style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: 'var(--accent-dim)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--accent)',
              lineHeight: '1.5',
              borderLeft: '2px solid var(--accent)',
            }}>
              ✦ {aiExplanation}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
