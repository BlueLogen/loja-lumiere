import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_PASS = 'lumiere2025'
const SESSION_KEY = 'lumiere_admin_auth'

export function isAdminAuth() {
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

export default function AdminLogin() {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      navigate('/admin')
    } else {
      setError(true)
      setPass('')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <span>✦</span>
          <strong>Lumière</strong>
        </div>
        <h2>Painel Administrativo</h2>
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite a senha..."
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false) }}
              autoFocus
            />
            {error && <span className="admin-field__error">Senha incorreta</span>}
          </div>
          <button type="submit" className="btn btn--gold btn--full">Entrar</button>
        </form>
        <p className="admin-login__hint">Senha padrão: <code>lumiere2025</code></p>
      </div>
    </div>
  )
}
