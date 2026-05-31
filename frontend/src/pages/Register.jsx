import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    const result = await register(form.username, form.email, form.password)
    if (result.success) {
      toast.success('Account created! Welcome to CineMatch')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Film size={32} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
          <h1 className="section-title">JOIN FREE</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Start tracking and discovering films
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {[
            { label: 'Username', key: 'username', type: 'text', placeholder: 'movie_lover' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {label}
              </label>
              <input
                className="input"
                type={type}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '15px', marginTop: '8px' }}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
