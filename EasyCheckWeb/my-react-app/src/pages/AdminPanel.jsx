// Panel del rol administrador: CU-02 (registrar usuario), CU-09 (nueva
// asignatura) y CU-03 (asistencia por estudiante, compartido con director).
import { useState } from 'react'
import { registerUser, createSubject } from '../api/endpoints'
import StudentAttendanceQuery from '../components/StudentAttendanceQuery'
import Feedback from '../components/Feedback'

const TABS = [
  { id: 'user', label: 'Registrar usuario' },
  { id: 'subject', label: 'Nueva asignatura' },
  { id: 'attendance', label: 'Asistencia por estudiante' },
]

// Valores del enum UserRole del backend (CU-02).
const USER_ROLES = ['ESTUDIANTE', 'PROFESOR', 'DIRECTOR_CARRERA']

function RegisterUserForm() {
  const empty = {
    rut: '',
    institutionalEmail: '',
    institutionalPassword: '',
    fullName: '',
    role: 'ESTUDIANTE',
  }
  const [form, setForm] = useState(empty)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setLoading(true)
    try {
      const user = await registerUser({ ...form, rut: form.rut.trim() })
      setFeedback({
        type: 'success',
        text: `Usuario ${user.fullName ?? form.fullName} (${user.rut ?? form.rut}) registrado con rol ${user.role ?? form.role}.`,
      })
      setForm(empty)
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Registrar nuevo usuario</h2>
      <p className="hint">
        El correo institucional debe terminar en @ufromail.cl y su parte local
        tener exactamente 2 dígitos (validación stub de la Intranet UFRO), p. ej.
        ana.garcia22@ufromail.cl.
      </p>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          RUT
          <input value={form.rut} onChange={set('rut')} placeholder="12345678-5" />
        </label>
        <label>
          Nombre completo
          <input value={form.fullName} onChange={set('fullName')} placeholder="Ana García" />
        </label>
        <label>
          Correo institucional
          <input
            type="email"
            value={form.institutionalEmail}
            onChange={set('institutionalEmail')}
            placeholder="ana.garcia22@ufromail.cl"
          />
        </label>
        <label>
          Contraseña institucional
          <input
            type="password"
            value={form.institutionalPassword}
            onChange={set('institutionalPassword')}
          />
        </label>
        <label>
          Rol
          <select value={form.role} onChange={set('role')}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrar usuario'}
          </button>
        </div>
      </form>
      <Feedback feedback={feedback} />
    </section>
  )
}

function CreateSubjectForm() {
  const empty = { code: '', name: '', career: '' }
  const [form, setForm] = useState(empty)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setLoading(true)
    try {
      const result = await createSubject({
        code: form.code.trim(),
        name: form.name.trim(),
        career: form.career.trim(),
      })
      setFeedback({
        type: 'success',
        text: `${result.message}: ${result.subject.code} — ${result.subject.name} (${result.subject.career}).`,
      })
      setForm(empty)
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Registrar nueva asignatura</h2>
      <p className="hint">
        Código único; solo letras, números, espacios y guiones. Seed existente:
        ICC-101, ICC-202, ICC-303.
      </p>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Código
          <input value={form.code} onChange={set('code')} placeholder="ICC-404" />
        </label>
        <label>
          Nombre
          <input value={form.name} onChange={set('name')} placeholder="Sistemas Operativos" />
        </label>
        <label>
          Carrera
          <input value={form.career} onChange={set('career')} placeholder="ICINF" />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Registrar asignatura'}
          </button>
        </div>
      </form>
      <Feedback feedback={feedback} />
    </section>
  )
}

export default function AdminPanel() {
  const [tab, setTab] = useState('user')

  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'user' && <RegisterUserForm />}
      {tab === 'subject' && <CreateSubjectForm />}
      {tab === 'attendance' && <StudentAttendanceQuery />}
    </>
  )
}
