import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hover, setHover] = useState(0)
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  const display = hover || value

  if (readonly) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={value >= i ? 'var(--accent)' : value >= i - 0.5 ? 'url(#half)' : 'none'}
            color={value >= i - 0.5 ? 'var(--accent)' : 'var(--text-muted)'}
          />
        ))}
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '4px' }}>
          {value.toFixed(1)}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{ position: 'relative', cursor: 'pointer', width: size + 6, height: size + 4 }}
          onMouseLeave={() => setHover(0)}
        >
          {/* Left half — half star */}
          <div
            style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
            onMouseEnter={() => setHover(i - 0.5)}
            onClick={() => onChange && onChange(i - 0.5)}
          />
          {/* Right half — full star */}
          <div
            style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange && onChange(i)}
          />
          <Star
            size={size}
            fill={display >= i ? 'var(--accent)' : display >= i - 0.5 ? 'var(--accent)' : 'none'}
            color={display >= i - 0.5 ? 'var(--accent)' : 'var(--text-muted)'}
            style={{ transition: 'all 0.15s', opacity: display >= i - 0.5 ? 1 : 0.4 }}
          />
        </div>
      ))}
      {value > 0 && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '6px', alignSelf: 'center' }}>
          {value}/5
        </span>
      )}
    </div>
  )
}
