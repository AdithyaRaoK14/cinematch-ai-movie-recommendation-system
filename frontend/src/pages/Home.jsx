import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Sparkles, Star, ArrowRight, ChevronRight, Film } from 'lucide-react'
import api from '../lib/api'
import MovieGrid from '../components/movie/MovieGrid'
import useAuthStore from '../store/authStore'

const FEATURED_GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Thriller', 'Romance', 'Animation']

export default function Home() {
  const { user } = useAuthStore()

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/movies/trending').then(r => r.data),
  })

  const { data: topRated } = useQuery({
    queryKey: ['popular'],
    queryFn: () => api.get('/movies/popular').then(r => r.data),
  })

  const { data: recommended } = useQuery({
    queryKey: ['recommended', user?.id],
    queryFn: () => api.get('/recommendations/for-me').then(r => r.data),
    enabled: !!user,
  })

  // Load 3 genre rows
  const genreQueries = FEATURED_GENRES.slice(0, 3).map(genre => ({
    genre,
    query: useQuery({
      queryKey: ['genre', genre],
      queryFn: () => api.get(`/movies/genre/${encodeURIComponent(genre)}`).then(r => r.data),
    })
  }))

  const hero = trending?.results?.[0]

  return (
    <div>
      {/* Hero */}
      {hero && (
        <div style={{ position: 'relative', height: '560px', overflow: 'hidden', marginBottom: '64px' }}>
          {hero.backdrop_path && (
            <img src={hero.backdrop_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(10,10,15,0.98) 45%, rgba(10,10,15,0.2))',
            display: 'flex', alignItems: 'center',
          }}>
            <div className="container">
              <div className="badge badge-accent" style={{ marginBottom: '16px' }}>
                <TrendingUp size={12} style={{ marginRight: '4px' }} /> Trending Now
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
                letterSpacing: '0.04em', lineHeight: '1',
                marginBottom: '16px', maxWidth: '600px',
              }}>
                {hero.title}
              </h1>
              {hero.tagline && (
                <p style={{ color: 'var(--accent)', fontStyle: 'italic', marginBottom: '12px', fontSize: '15px' }}>
                  "{hero.tagline}"
                </p>
              )}
              <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', marginBottom: '28px', lineHeight: '1.7', fontSize: '15px' }}>
                {hero.overview?.slice(0, 200)}{hero.overview?.length > 200 ? '...' : ''}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/movie/${hero.id}`} className="btn btn-primary">
                  View Movie <ArrowRight size={16} />
                </Link>
                <Link to="/search" className="btn btn-ghost">
                  Browse All
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                  <Star size={16} fill="currentColor" />
                  <span style={{ fontWeight: '600' }}>{hero.vote_average?.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/ 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ paddingBottom: '80px' }}>

        {/* Genre pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {FEATURED_GENRES.map(g => (
            <Link key={g} to={`/search?genre=${encodeURIComponent(g)}`}
              className="badge badge-muted"
              style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', textDecoration: 'none',
                transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
            >
              {g}
            </Link>
          ))}
        </div>

        {/* Personalized */}
        {user && recommended && (
          <Section title="PICKED FOR YOU" icon={<Sparkles size={20} color="var(--accent)" />}
            subtitle={recommended.message} linkTo="/profile">
            <MovieGrid movies={recommended.movies?.slice(0, 12)} />
          </Section>
        )}

        {/* Trending */}
        <Section title="TRENDING NOW" icon={<TrendingUp size={20} color="var(--accent)" />}
          linkTo="/search">
          <MovieGrid movies={trending?.results?.slice(0, 12)} />
        </Section>

        {/* Top Rated */}
        <Section title="TOP RATED" icon={<Star size={20} color="var(--accent)" />}
          linkTo="/search?min_rating=8">
          <MovieGrid movies={topRated?.results?.slice(0, 12)} />
        </Section>

        {/* Genre rows */}
        {genreQueries.map(({ genre, query }) => (
          query.data?.results?.length > 0 && (
            <Section key={genre} title={genre.toUpperCase()}
              linkTo={`/search?genre=${encodeURIComponent(genre)}`}>
              <MovieGrid movies={query.data.results.slice(0, 12)} />
            </Section>
          )
        ))}

        {/* AI Pick CTA */}
        <div style={{
          marginTop: '16px',
          padding: '48px 40px',
          background: 'linear-gradient(135deg, rgba(232,197,71,0.08), rgba(232,197,71,0.02))',
          border: '1px solid rgba(232,197,71,0.2)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '24px',
        }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>NOT SURE WHAT TO WATCH?</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tell our local AI what you're in the mood for and it'll find the perfect film.
            </p>
          </div>
          <Link to="/ai-search" className="btn btn-primary" style={{ fontSize: '15px', padding: '12px 28px' }}>
            <Sparkles size={16} /> Try AI Pick
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, subtitle, linkTo, children }) {
  return (
    <section style={{ marginBottom: '56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            {icon}
            <h2 className="section-title">{title}</h2>
          </div>
          {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{subtitle}</p>}
        </div>
        {linkTo && (
          <Link to={linkTo} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none',
            transition: 'color var(--transition)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
