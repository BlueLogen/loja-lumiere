import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AUTH_URL    = 'https://mvtdqwedgdcxjfvhfrdp.supabase.co/functions/v1/admin-auth'
const SESSION_KEY = 'lumiere_admin_token'

export function isAdminAuth() {
  const token = sessionStorage.getItem(SESSION_KEY)
  if (!token) return false
  // Token format: "{timestamp}.{hmac}" — valida que não é muito antigo (8h)
  const ts = parseInt(token.split('.')[0], 10)
  if (!ts || Date.now() - ts > 8 * 60 * 60 * 1000) {
    sessionStorage.removeItem(SESSION_KEY)
    return false
  }
  return true
}

export default function AdminLogin() {
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(AUTH_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pass }),
      })
      const data = await res.json()
      if (data.ok && data.token) {
        sessionStorage.setItem(SESSION_KEY, data.token)
        navigate('/admin')
      } else {
        setError('Senha incorreta')
        setPass('')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <img src="/logo.png" alt="Basic & Bijus" className="admin-login__logo-img" />
        </div>
        <h2>Painel Administrativo</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite a senha..."
              value={pass}
              onChange={e => { setPass(e.target.value); setError('') }}
              autoFocus
              disabled={loading}
            />
            {error && <span className="admin-field__error">{error}</span>}
          </div>
          <button type="submit" className="btn btn--gold btn--full" disabled={loading}>
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
