import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, Film, BarChart2 } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import StarRating from '../components/ui/StarRating'

export default function Profile() {
  const { user } = useAuthStore()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => api.get('/reviews/user/me').then((r) => r.data),
  })

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
    : null

  const ratingDist = reviews?.reduce((acc, r) => {
    const key = Math.round(r.rating)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px', maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '2px solid rgba(232,197,71,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: '700', color: 'var(--accent)',
          fontFamily: 'var(--font-display)',
        }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="section-title">{user?.username?.toUpperCase()}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px',
      }}>
        {[
          { icon: <Film size={20} />, label: 'Films reviewed', value: reviews?.length || 0 },
          { icon: <Star size={20} />, label: 'Average rating', value: avgRating ? `${avgRating} / 5` : '—' },
          { icon: <BarChart2 size={20} />, label: 'Top genre', value: '—' },
        ].map(({ icon, label, value }) => (
          <div key={label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              {icon}
            </div>
            <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <h2 className="section-title" style={{ marginBottom: '24px' }}>MY REVIEWS</h2>

      {isLoading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : reviews?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Film size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No reviews yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
            Discover movies
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews?.map((review) => (
            <Link
              key={review.id}
              to={`/movie/${review.tmdb_movie_id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div>
                  <h3 style={{ fontWeight: '600', marginBottom: '6px' }}>{review.movie_title}</h3>
                  {review.content && (
                    <p style={{
                      color: 'var(--text-secondary)', fontSize: '13px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: '480px',
                    }}>
                      {review.content}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StarRating value={review.rating} readonly size={14} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
