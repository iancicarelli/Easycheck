// Cliente HTTP mínimo para la API EasyCheck.
// Las rutas relativas (/api/...) pasan por el proxy de Vite hacia el backend.

const SESSION_KEY = 'easycheck.session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiFetch(
  path,
  { method = 'GET', body, auth = true, headers: extraHeaders } = {},
) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const session = getSession()
    // TokenRolesGuard del backend: exige el token emitido por CU-01 en
    // Authorization: Bearer <token> (x-user-role ya no es aceptado).
    if (session?.token) headers.Authorization = `Bearer ${session.token}`
  }

  // Cabeceras extra (p. ej. x-reader-key del lector de sala, o un Authorization
  // distinto al de la sesión). Se aplican al final para poder sobreescribir.
  Object.assign(headers, extraHeaders)

  let response
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el backend. ¿Está corriendo en http://localhost:3000?',
      0,
      null,
    )
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // respuestas sin body JSON
  }

  if (!response.ok) {
    // El backend usa `message` (auth/subject/guards) o `error` (assistance/users).
    const raw = data?.message ?? data?.error ?? `Error ${response.status}`
    const message = Array.isArray(raw) ? raw.join(', ') : raw
    throw new ApiError(message, response.status, data)
  }

  return data
}
