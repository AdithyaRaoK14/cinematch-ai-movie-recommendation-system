import { useState } from 'react'
import { Sparkles, Wand2, Info } from 'lucide-react'
import api from '../lib/api'
import MovieGrid from '../components/movie/MovieGrid'
import toast from 'react-hot-toast'

const EXAMPLE_QUERIES = [
  "Something like Interstellar but funnier",
  "A dark thriller with a twist ending",
  "Feel-good movie for a rainy Sunday",
  "Sci-fi with great world-building, not too action-heavy",
  "A crime drama like The Godfather",
  "Something emotional that will make me cry",
]

export default function AISearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSearch = async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post(`/recommendations/ai-search?query=${encodeURIComponent(q)}`)
      setResult(res.data)
    } catch (err) {
      toast.error('AI search failed. Make sure Ollama is running.')
    } finally {
      setLoading(false)
    }
  }

  const aiExplanations = {}
  result?.movies?.forEach((m) => {
    if (m.ai_explanation) aiExplanations[m.id] = m.ai_explanation
  })

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ maxWidth: '680px', margin: '0 auto 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(232,197,71,0.3)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={26} color="var(--accent)" />
          </div>
        </div>
        <h1 className="section-title" style={{ marginBottom: '12px' }}>AI MOVIE PICKER</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Describe what you're in the mood for in plain English. Powered by your local Ollama model.
        </p>
      </div>

      {/* Input */}
      <div style={{ maxWidth: '680px', margin: '0 auto 32px' }}>
        <div style={{ position: 'relative' }}>
          <textarea
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "Something like Inception but with more heart..."'
            rows={3}
            style={{ resize: 'none', paddingRight: '140px', lineHeight: '1.6' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', bottom: '12px', right: '12px',
              opacity: loading || !query.trim() ? 0.6 : 1,
            }}
          >
            <Wand2 size={15} />
            {loading ? 'Thinking...' : 'Find films'}
          </button>
        </div>

        {/* Example queries */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>
            Try one of these:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {EXAMPLE_QUERIES.map((eq) => (
              <button
                key={eq}
                onClick={() => { setQuery(eq); handleSearch(eq) }}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Asking your local AI...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {/* Parsed query info */}
          {result.parsed_query && (
            <div style={{
              maxWidth: '680px', margin: '0 auto 32px',
              padding: '16px 20px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(232,197,71,0.2)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ color: 'var(--accent)', fontSize: '14px' }}>
                  {result.parsed_query.explanation}
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {result.parsed_query.genres?.map((g) => (
                  <span key={g} className="badge badge-accent" style={{ fontSize: '11px' }}>{g}</span>
                ))}
                {result.parsed_query.mood && (
                  <span className="badge badge-muted" style={{ fontSize: '11px' }}>mood: {result.parsed_query.mood}</span>
                )}
                {result.parsed_query.reference_movie && (
                  <span className="badge badge-muted" style={{ fontSize: '11px' }}>like: {result.parsed_query.reference_movie}</span>
                )}
              </div>
            </div>
          )}

          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            {result.movies?.length} FILMS FOUND
          </h2>
          <MovieGrid movies={result.movies} aiExplanations={aiExplanations} />
        </div>
      )}
    </div>
  )
}
