import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Header() {
  const { count, setOpen } = useCart()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/produtos?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <header className="header">
        <div className="header__top">
          <Link to="/" className="header__logo">
            <img src="/logo.png" alt="Basic & Bijus" className="header__logo-img" />
          </Link>

          <form className="header__search" onSubmit={handleSearch}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar joias..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </form>

          <button className="header__cart-btn" onClick={() => setOpen(true)} aria-label="Carrinho">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="header__badge">{count}</span>}
          </button>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav__item${location.pathname === '/' ? ' active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Início</span>
        </Link>
        <Link to="/produtos" className={`bottom-nav__item${location.pathname === '/produtos' ? ' active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
            <rect x="15" y="15" width="7" height="7"/><rect x="2" y="15" width="7" height="7"/>
          </svg>
          <span>Coleção</span>
        </Link>
        <button className="bottom-nav__item bottom-nav__cart" onClick={() => setOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {count > 0 && <span className="header__badge">{count}</span>}
          <span>Carrinho</span>
        </button>
        <Link to="/sobre" className={`bottom-nav__item${location.pathname === '/sobre' ? ' active' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4"/>
            <path d="M20 21a8 8 0 10-16 0"/>
          </svg>
          <span>Sobre</span>
        </Link>
      </nav>
    </>
  )
}
