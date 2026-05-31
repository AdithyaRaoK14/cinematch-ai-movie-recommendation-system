import { useState } from 'react'
import StarRating from '../ui/StarRating'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function ReviewForm({ movie, existingReview, onSuccess }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [content, setContent] = useState(existingReview?.content || '')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div style={{
        padding: '20px', background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius)', border: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Sign in to write a review
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return }
    setLoading(true)
    try {
      if (existingReview) {
        await api.put(`/reviews/${existingReview.id}`, { rating, content })
        toast.success('Review updated!')
      } else {
        await api.post('/reviews/', {
          tmdb_movie_id: movie.id,
          movie_title: movie.title,
          rating,
          content,
        })
        toast.success('Review posted!')
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: '20px', background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius)', border: '1px solid var(--border)',
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
        {existingReview ? 'Edit your review' : 'Write a review'}
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Your rating
        </label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Review (optional)
        </label>
        <textarea
          className="input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you think?"
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Posting...' : existingReview ? 'Update review' : 'Post review'}
      </button>
    </div>
  )
}
