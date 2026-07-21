// Endpoints del backend EasyCheck, agrupados por caso de uso.
import { apiFetch } from './client'

const enc = encodeURIComponent

// CU-01 — inicio de sesión
export function login(rut, password) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: { rut, password },
    auth: false,
  })
}

// CU-02 — registro de nuevo usuario (administrativo)
export function registerUser(dto) {
  return apiFetch('/api/v1/users/register', { method: 'POST', body: dto })
}

// CU-09 — registro de nueva asignatura (administrativo)
export function createSubject(dto) {
  return apiFetch('/api/v1/subjects', { method: 'POST', body: dto })
}

// CU-03 — asistencia de un estudiante por asignatura (director / administrador)
export function getStudentAttendance(rut) {
  return apiFetch(`/api/v1/students/${enc(rut)}/attendance`)
}

// CU-07/CU-08 (apoyo) — clases que dicta el profesor con sus estados, para
// listarlas con su id en vez de escribirlo a mano. El RUT sale del token.
export function getProfessorClasses() {
  return apiFetch('/api/v1/professors/me/classes')
}

// CU-05 — asistencia de los estudiantes de una asignatura (profesor).
// El RUT del profesor sale del token (ruta /me).
export function getSubjectAssistance(subjectCode) {
  return apiFetch(
    `/api/v1/professors/me/subjects/${enc(subjectCode)}/attendance`,
  )
}

// CU-07 / CU-08 — deshabilitar / habilitar el registro de una clase (profesor).
// La ruta legacy /:rut acepta ambos estados; el backend verifica rut === token.
export function setClassRegistration(professorRut, classId, status) {
  return apiFetch(
    `/api/v1/professors/${enc(professorRut)}/classes/${enc(classId)}/registration`,
    { method: 'PATCH', body: { status } },
  )
}

// CU-08 — habilitar / deshabilitar la ventana de edición de una clase.
// Requiere que el registro esté DISABLED antes de habilitar la edición.
export function setClassEditing(classId, status) {
  return apiFetch(`/api/v1/professors/me/classes/${enc(classId)}/editing`, {
    method: 'PATCH',
    body: { status },
  })
}

// CU-08 — editar un registro de asistencia (profesor, ruta /me)
export function editAssistanceRecord(recordId, present) {
  return apiFetch(`/api/v1/professors/me/assistance/${enc(recordId)}`, {
    method: 'PATCH',
    body: { present },
  })
}

// Apoyo a CU-08: registros de un estudiante en una asignatura (con sus ids).
export function getStudentSubjectRecords(studentRut, subjectCode) {
  return apiFetch(
    `/api/v1/students/${enc(studentRut)}/assistance?subject=${enc(subjectCode)}`,
  )
}

// ── CU-06 (lado lector de sala) ──────────────────────────────────────────────
// El lector es un dispositivo, no un usuario: se autentica con la reader key en
// la cabecera x-reader-key (no lleva token). Registra la asistencia a partir del
// qrToken firmado que muestra la app del estudiante.
export function registerAssistance(qrToken, readerKey) {
  return apiFetch('/api/v1/assistance/register', {
    method: 'POST',
    body: { qrToken },
    auth: false,
    headers: { 'x-reader-key': readerKey },
  })
}

// Respaldo de la demo: reproduce el lado del estudiante (CU-06) usando un token
// de estudiante, para generar un qrToken real cuando la cámara no está
// disponible. `studentToken` es el token mock del backend (mock-token-<rut>-<rol>).
export function getStudentClassesWith(studentToken) {
  return apiFetch('/api/v1/students/me/classes', {
    auth: false,
    headers: { Authorization: `Bearer ${studentToken}` },
  })
}

export function generateStudentQrWith(studentToken, classId) {
  return apiFetch(`/api/v1/students/me/classes/${enc(classId)}/qr`, {
    method: 'POST',
    auth: false,
    headers: { Authorization: `Bearer ${studentToken}` },
  })
}
