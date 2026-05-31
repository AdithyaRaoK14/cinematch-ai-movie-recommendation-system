import MovieCard from './MovieCard'

export default function MovieGrid({ movies, aiExplanations = {} }) {
  if (!movies?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        No movies found
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '16px',
    }}>
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          aiExplanation={aiExplanations[movie.id]}
        />
      ))}
    </div>
  )
}
