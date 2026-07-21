// CU-03 — Asistencia de un estudiante por asignatura (director / administrador).
import { useState } from 'react'
import { getStudentAttendance } from '../api/endpoints'
import Feedback from './Feedback'

export default function StudentAttendanceQuery() {
  const [rut, setRut] = useState('')
  const [rows, setRows] = useState(null)
  const [queriedRut, setQueriedRut] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setRows(null)
    setLoading(true)
    try {
      const data = await getStudentAttendance(rut.trim())
      setRows(data)
      setQueriedRut(rut.trim())
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Asistencia por estudiante</h2>
      <p className="hint">
        Consulta el porcentaje de asistencia de un estudiante en cada asignatura
        inscrita. Seed: 11111111-1 (Ana Pérez), 55555555-5 (Bruno Soto).
      </p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          placeholder="RUT del estudiante (11111111-1)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>
      <Feedback feedback={feedback} />

      {rows && rows.length === 0 && (
        <p className="hint">El estudiante {queriedRut} no tiene asignaturas inscritas.</p>
      )}
      {rows && rows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Clases asistidas</th>
              <th>Total de clases</th>
              <th>% asistencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.subjectName}>
                <td>{row.subjectName}</td>
                <td>{row.attendedClasses}</td>
                <td>{row.totalClasses}</td>
                <td>
                  <span className={`badge ${row.attendancePercentage >= 75 ? 'ok' : 'warn'}`}>
                    {row.attendancePercentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
