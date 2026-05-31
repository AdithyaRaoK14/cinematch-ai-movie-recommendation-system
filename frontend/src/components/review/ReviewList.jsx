import { Trash2, Edit2 } from 'lucide-react'
import StarRating from '../ui/StarRating'
import useAuthStore from '../../store/authStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function ReviewList({ reviews, onRefresh }) {
  const { user } = useAuthStore()

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`)
      toast.success('Review deleted')
      onRefresh?.()
    } catch {
      toast.error('Failed to delete review')
    }
  }

  if (!reviews?.length) {
    return (
      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>
        No reviews yet. Be the first!
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {reviews.map((review) => (
        <div key={review.id} className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{review.username}</span>
              <div style={{ marginTop: '4px' }}>
                <StarRating value={review.rating} readonly size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </span>
              {user?.id === review.user_id && (
                <button
                  className="btn btn-danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          {review.content && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              {review.content}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
