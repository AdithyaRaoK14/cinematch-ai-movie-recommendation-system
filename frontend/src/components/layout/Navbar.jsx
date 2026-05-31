import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Sparkles, User, LogOut, Film } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '72px',
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '32px', width: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Film size={22} color="var(--accent)" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
          }}>
            CINE<span style={{ color: 'var(--accent)' }}>MATCH</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <NavLink to="/search" active={isActive('/search')} icon={<Search size={15} />}>Search</NavLink>
          <NavLink to="/ai-search" active={isActive('/ai-search')} icon={<Sparkles size={15} />}>AI Pick</NavLink>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', align: 'center', gap: '8px' }}>
          {user ? (
            <>
              <NavLink to="/profile" active={isActive('/profile')} icon={<User size={15} />}>
                {user.username}
              </NavLink>
              <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '8px 14px' }}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '14px',
        fontWeight: '500',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-dim)' : 'transparent',
        transition: 'all var(--transition)',
        textDecoration: 'none',
      }}
    >
      {icon}
      {children}
    </Link>
  )
}
