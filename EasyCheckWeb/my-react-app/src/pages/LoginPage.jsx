// CU-01 — Formulario de inicio de sesión (compartido por todos los roles).
import { useState } from 'react'
import { login } from '../api/endpoints'
import Feedback from '../components/Feedback'

const WEB_ROLES = ['profesor', 'director', 'administrador']

export default function LoginPage({ onLogin }) {
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setLoading(true)
    try {
      const result = await login(rut.trim(), password)
      if (!WEB_ROLES.includes(result.role)) {
        setFeedback({
          type: 'error',
          text: `El panel web es solo para profesores, dirección y administración. Su rol (${result.role}) debe usar la app móvil.`,
        })
        return
      }
      onLogin({
        rut: result.user.rut,
        fullName: result.user.fullName,
        role: result.role,
        token: result.token,
      })
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-layout">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>EasyCheck</h1>
        <p className="subtitle">Control de asistencia — UFRO · Panel web</p>

        <label>
          RUT
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12345678-5"
            autoFocus
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
        <Feedback feedback={feedback} />

        <details className="seed-hint">
          <summary>Cuentas de demo (seed Docker)</summary>
          <table>
            <tbody>
              <tr><td>22222222-2</td><td>profesor</td></tr>
              <tr><td>33333333-3</td><td>director de carrera</td></tr>
              <tr><td>44444444-4</td><td>administrador</td></tr>
            </tbody>
          </table>
          <p>Contraseña de todas las cuentas seed: <code>demo</code>.</p>
        </details>

        <a className="reader-entry" href="#lector">
          📷 Abrir lector de sala (demo)
        </a>
      </form>
    </div>
  )
}
