// Panel del profesor: CU-05 (asistencia de su asignatura), CU-07 (deshabilitar
// registro), CU-08 (habilitar registro y editar registros de asistencia).
// El RUT del profesor sale de la sesión iniciada en CU-01.
import { useEffect, useState } from 'react'
import {
  getSubjectAssistance,
  getProfessorClasses,
  setClassRegistration,
  setClassEditing,
  editAssistanceRecord,
  getStudentSubjectRecords,
} from '../api/endpoints'
import Feedback from '../components/Feedback'

// CU-05 — roster de asistencia de una asignatura que dicta el profesor.
function SubjectAssistance() {
  const [subjectCode, setSubjectCode] = useState('')
  const [rows, setRows] = useState(null)
  const [queriedCode, setQueriedCode] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    setRows(null)
    setLoading(true)
    try {
      const data = await getSubjectAssistance(subjectCode.trim())
      setRows(data)
      setQueriedCode(subjectCode.trim())
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Asistencia de mi asignatura</h2>
      <p className="hint">
        Muestra el porcentaje de asistencia de cada estudiante inscrito. Seed: el
        profesor 22222222-2 dicta ICC-101 y ICC-202.
      </p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          placeholder="Código de asignatura (ICC-101)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>
      <Feedback feedback={feedback} />

      {rows && rows.length === 0 && (
        <p className="hint">No hay estudiantes inscritos en {queriedCode}.</p>
      )}
      {rows && rows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>RUT</th>
              <th>Estudiante</th>
              <th>Clases asistidas</th>
              <th>Total de clases</th>
              <th>% asistencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rut}>
                <td>{row.rut}</td>
                <td>{row.name}</td>
                <td>{row.classesAttended}</td>
                <td>{row.totalClasses}</td>
                <td>
                  <span className={`badge ${row.assistancePercentage >= 75 ? 'ok' : 'warn'}`}>
                    {row.assistancePercentage}%
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

// CU-07 / CU-08 — estados de las clases que dicta el profesor: registro (permite
// que los estudiantes marquen asistencia) y ventana de edición (permite corregir
// registros). Lista las clases con su id, así no hay que escribirlo a mano.
function ClassStates({ professorRut }) {
  const [classes, setClasses] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  // Recarga sin tocar el feedback (para conservar el aviso de la última acción).
  const reload = async () => {
    const data = await getProfessorClasses()
    setClasses([...data].sort((a, b) => a.classId - b.classId))
  }

  const load = async () => {
    setFeedback(null)
    setLoading(true)
    try {
      await reload()
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyRegistration = async (classId, status) => {
    setFeedback(null)
    setBusyId(classId)
    try {
      const result = await setClassRegistration(professorRut, classId, status)
      setFeedback({
        type: 'success',
        text: `Clase ${result.classId}: registro ${
          result.registrationStatus === 'ENABLED' ? 'habilitado' : 'deshabilitado'
        }.`,
      })
      await reload()
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setBusyId(null)
    }
  }

  const applyEditing = async (classId, status) => {
    setFeedback(null)
    setBusyId(classId)
    try {
      const result = await setClassEditing(classId, status)
      setFeedback({
        type: 'success',
        text: `Clase ${result.classId}: edición ${
          result.editingStatus === 'ENABLED' ? 'habilitada' : 'deshabilitada'
        }.`,
      })
      await reload()
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setBusyId(null)
    }
  }

  const badge = (value, onLabel, offLabel) => (
    <span className={`badge ${value === 'ENABLED' ? 'ok' : 'warn'}`}>
      {value === 'ENABLED' ? onLabel : offLabel}
    </span>
  )

  return (
    <section className="card">
      <h2>Estados de mis clases</h2>
      <p className="hint">
        CU-07: deshabilita el registro para que los estudiantes ya no marquen
        asistencia. CU-08: con el registro deshabilitado, habilita la ventana de
        edición para corregir registros. Solo aparecen las clases de las
        asignaturas que dictas.
      </p>
      <div className="inline-form">
        <button className="secondary" onClick={load} disabled={loading}>
          {loading ? 'Cargando…' : 'Recargar clases'}
        </button>
      </div>
      <Feedback feedback={feedback} />

      {classes && classes.length === 0 && !loading && (
        <p className="hint">No tienes clases asignadas.</p>
      )}
      {classes && classes.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Asignatura</th>
              <th>Fecha</th>
              <th>Registro</th>
              <th>Edición</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const rowBusy = busyId === c.classId
              const regOn = c.registrationStatus === 'ENABLED'
              const editOn = c.editingStatus === 'ENABLED'
              return (
                <tr key={c.classId}>
                  <td>{c.classId}</td>
                  <td>{c.subjectId}</td>
                  <td>{new Date(c.date).toLocaleDateString('es-CL')}</td>
                  <td>{badge(c.registrationStatus, 'HABILITADO', 'DESHABILITADO')}</td>
                  <td>{badge(c.editingStatus, 'HABILITADA', 'DESHABILITADA')}</td>
                  <td className="row-actions">
                    {regOn ? (
                      <button
                        className="danger"
                        disabled={rowBusy}
                        onClick={() => applyRegistration(c.classId, 'DISABLED')}
                      >
                        Deshabilitar registro
                      </button>
                    ) : (
                      <button
                        disabled={rowBusy}
                        onClick={() => applyRegistration(c.classId, 'ENABLED')}
                      >
                        Habilitar registro
                      </button>
                    )}
                    {editOn ? (
                      <button
                        className="secondary"
                        disabled={rowBusy}
                        onClick={() => applyEditing(c.classId, 'DISABLED')}
                      >
                        Deshabilitar edición
                      </button>
                    ) : (
                      <button
                        className="secondary"
                        disabled={rowBusy || regOn}
                        title={
                          regOn
                            ? 'Deshabilita el registro antes de habilitar la edición'
                            : undefined
                        }
                        onClick={() => applyEditing(c.classId, 'ENABLED')}
                      >
                        Habilitar edición
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

// CU-08 — editar registros de asistencia (presente/ausente) de un estudiante.
function EditAssistance() {
  const [studentRut, setStudentRut] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [result, setResult] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const search = async (event) => {
    event?.preventDefault()
    setFeedback(null)
    setLoading(true)
    try {
      const data = await getStudentSubjectRecords(studentRut.trim(), subjectCode.trim())
      setResult(data)
      if (data.records.length === 0) {
        setFeedback({
          type: 'error',
          text: `Sin registros de asistencia para ${studentRut.trim()} en ${subjectCode.trim()}.`,
        })
      }
    } catch (e) {
      setResult(null)
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  const toggle = async (record) => {
    setFeedback(null)
    setLoading(true)
    try {
      const updated = await editAssistanceRecord(record.id, !record.present)
      setFeedback({
        type: 'success',
        text: `Registro ${updated.recordId} de ${updated.studentRut} marcado como ${
          updated.present ? 'presente' : 'ausente'
        }.`,
      })
      // refresca la tabla con el nuevo estado
      const data = await getStudentSubjectRecords(studentRut.trim(), subjectCode.trim())
      setResult(data)
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2>Editar registros de asistencia</h2>
      <p className="hint">
        Busca los registros de un estudiante en una asignatura que dictas y
        corrige presente/ausente (CU-08). La clase debe tener la ventana de
        edición habilitada (pestaña anterior). Seed: 11111111-1 y 55555555-5
        tienen registros en ICC-101.
      </p>
      <form className="inline-form" onSubmit={search}>
        <input
          value={studentRut}
          onChange={(e) => setStudentRut(e.target.value)}
          placeholder="RUT del estudiante (11111111-1)"
        />
        <input
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          placeholder="Asignatura (ICC-101)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar registros'}
        </button>
      </form>
      <Feedback feedback={feedback} />

      {result && result.records.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID registro</th>
              <th>Clase</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {result.records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.classId}</td>
                <td>{new Date(record.date).toLocaleDateString('es-CL')}</td>
                <td>
                  <span className={`badge ${record.present ? 'ok' : 'warn'}`}>
                    {record.present ? 'Presente' : 'Ausente'}
                  </span>
                </td>
                <td>
                  <button
                    className="secondary"
                    disabled={loading}
                    onClick={() => toggle(record)}
                  >
                    Marcar {record.present ? 'ausente' : 'presente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

const TABS = [
  { id: 'roster', label: 'Asistencia de asignatura' },
  { id: 'registration', label: 'Habilitar / deshabilitar registro' },
  { id: 'edit', label: 'Editar registros' },
]

export default function ProfessorPanel({ session }) {
  const [tab, setTab] = useState('roster')

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
      {tab === 'roster' && <SubjectAssistance />}
      {tab === 'registration' && <ClassStates professorRut={session.rut} />}
      {tab === 'edit' && <EditAssistance />}
    </>
  )
}
