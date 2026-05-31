import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import MovieGrid from '../components/movie/MovieGrid'

const GENRES = ['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama',
  'Family','Fantasy','History','Horror','Music','Mystery','Romance','Science Fiction','Thriller','War','Western']

const DECADES = [
  { label: 'All Time', min: null, max: null },
  { label: '2020s', min: 2020, max: 2029 },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '1990s', min: 1990, max: 1999 },
  { label: '1980s', min: 1980, max: 1989 },
  { label: 'Older', min: null, max: 1979 },
]

const RATINGS = [
  { label: 'Any', value: null },
  { label: '9+', value: 9 },
  { label: '8+', value: 8 },
  { label: '7+', value: 7 },
  { label: '6+', value: 6 },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('q') || '')
  const [showFilters, setShowFilters] = useState(false)

  const query      = searchParams.get('q') || ''
  const genre      = searchParams.get('genre') || ''
  const minYear    = searchParams.get('min_year') ? parseInt(searchParams.get('min_year')) : null
  const maxYear    = searchParams.get('max_year') ? parseInt(searchParams.get('max_year')) : null
  const minRating  = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')) : null
  const page       = parseInt(searchParams.get('page') || '1')

  const hasFilters = genre || minYear || maxYear || minRating

  const buildParams = (overrides = {}) => {
    const p = {}
    const merged = { q: query, genre, min_year: minYear, max_year: maxYear, min_rating: minRating, page, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p[k] = v })
    return p
  }

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, genre, minYear, maxYear, minRating, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (genre) params.set('genre', genre)
      if (minYear) params.set('min_year', minYear)
      if (maxYear) params.set('max_year', maxYear)
      if (minRating) params.set('min_rating', minRating)
      params.set('page', page)
      return api.get(`/movies/search?${params}`).then(r => r.data)
    },
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(buildParams({ q: input.trim(), page: 1 }))
  }

  const setFilter = (key, value) => {
    setSearchParams(buildParams({ [key]: value || undefined, page: 1 }))
  }

  const setDecade = (decade) => {
    setSearchParams(buildParams({ min_year: decade.min || undefined, max_year: decade.max || undefined, page: 1 }))
  }

  const clearFilters = () => {
    setSearchParams(buildParams({ genre: undefined, min_year: undefined, max_year: undefined, min_rating: undefined, page: 1 }))
  }

  const activeDecade = DECADES.find(d => d.min === minYear && d.max === maxYear) || DECADES[0]
  const activeRating = RATINGS.find(r => r.value === minRating) || RATINGS[0]

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Search bar */}
      <div style={{ maxWidth: '680px', margin: '0 auto 32px' }}>
        <h1 className="section-title" style={{ textAlign: 'center', marginBottom: '24px' }}>
          FIND YOUR NEXT FILM
        </h1>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search by title, keyword..."
            style={{ paddingLeft: '44px', paddingRight: '120px', height: '52px', fontSize: '16px' }}
          />
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
            <button type="button" className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: '13px', gap: '4px' }}
              onClick={() => setShowFilters(f => !f)}>
              <SlidersHorizontal size={14} />
              Filters {hasFilters ? '•' : ''}
            </button>
          </div>
        </form>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{
          maxWidth: '680px', margin: '0 auto 32px',
          padding: '20px 24px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          {/* Genre filter */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Genre</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <FilterChip label="All" active={!genre} onClick={() => setFilter('genre', '')} />
              {GENRES.map(g => (
                <FilterChip key={g} label={g} active={genre === g} onClick={() => setFilter('genre', genre === g ? '' : g)} />
              ))}
            </div>
          </div>

          {/* Decade filter */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Era</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {DECADES.map(d => (
                <FilterChip key={d.label} label={d.label} active={activeDecade.label === d.label} onClick={() => setDecade(d)} />
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Min Rating</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {RATINGS.map(r => (
                <FilterChip key={r.label} label={r.label} active={activeRating.label === r.label}
                  onClick={() => setFilter('min_rating', r.value)} />
              ))}
            </div>
          </div>

          {hasFilters && (
            <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '6px 14px', marginTop: '4px' }} onClick={clearFilters}>
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter badges */}
      {hasFilters && !showFilters && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {genre && <ActiveFilter label={`Genre: ${genre}`} onRemove={() => setFilter('genre', '')} />}
          {(minYear || maxYear) && <ActiveFilter label={`Era: ${activeDecade.label}`} onRemove={() => setDecade(DECADES[0])} />}
          {minRating && <ActiveFilter label={`Rating: ${minRating}+`} onRemove={() => setFilter('min_rating', null)} />}
          <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Genre header */}
      {genre && !query && (
        <h2 className="section-title" style={{ marginBottom: '24px' }}>{genre.toUpperCase()}</h2>
      )}

      {/* Results count */}
      {data && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '13px' }}>
          {data.total_results?.toLocaleString()} films found
          {query && ` for "${query}"`}
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <>
          <MovieGrid movies={data?.results} />

          {/* Pagination */}
          {data?.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
              {page > 1 && (
                <button className="btn btn-ghost" onClick={() => setSearchParams(buildParams({ page: page - 1 }))}>
                  ← Previous
                </button>
              )}
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Page {page} of {Math.min(data.total_pages, 50)}
              </span>
              {page < Math.min(data.total_pages, 50) && (
                <button className="btn btn-ghost" onClick={() => setSearchParams(buildParams({ page: page + 1 }))}>
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: active ? '600' : '400',
        background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'rgba(232,197,71,0.4)' : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all var(--transition)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {label}
    </button>
  )
}

function ActiveFilter({ label, onRemove }) {
  return (
    <div className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}>
      {label}
      <button onClick={onRemove} style={{ color: 'var(--accent)', cursor: 'pointer', display: 'flex' }}>
        <X size={12} />
      </button>
    </div>
  )
}
