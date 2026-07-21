import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { ApiError } from '../api/client'
import {
  registerAssistance,
  getStudentClassesWith,
  generateStudentQrWith,
} from '../api/endpoints'

// ── Lector de sala (demo MVP) ────────────────────────────────────────────────
// Cierra el ciclo del QR de forma visual: la app del estudiante muestra el QR
// firmado (CU-06) y esta pantalla lo "escanea" con la webcam y lo registra vía
// POST /api/v1/assistance/register (ReaderGuard + x-reader-key). Nada de esto
// expone endpoints al público: todo ocurre dentro de la página.
//
// El lector es un DISPOSITIVO, no un usuario: se autentica solo con la reader
// key (READER_API_KEY del backend). Por defecto usa la de desarrollo; si el
// backend corre en Docker con otra, se cambia en el panel de ajustes de abajo.

const READER_KEY_STORAGE = 'easycheck.readerKey'
// Por defecto la de desarrollo; se puede fijar la real con VITE_READER_KEY
// (en un .env.local del proyecto web) o pegarla en «Ajustes del lector».
const DEFAULT_READER_KEY =
  import.meta.env.VITE_READER_KEY || 'easycheck-local-reader-key'

// RUT por defecto del respaldo simulado (cuenta seed Ana Pérez); editable en la
// UI para simular a cualquier estudiante. El token mock del backend tiene el
// formato mock-token-<rut>-<rol>; el TokenRolesGuard lo revalida contra la
// cuenta, así que la cripto del QR sigue siendo real.
const DEFAULT_SIM_RUT = '11111111-1'

// Construye el token de estudiante a partir del RUT (para el respaldo simulado).
const studentTokenFor = (rut) => `mock-token-${rut.trim()}-estudiante`

// Nombres conocidos de la data seed, solo para mostrar en la tarjeta de éxito
// (el endpoint del lector devuelve el RUT, no el nombre).
const KNOWN_NAMES = {
  '11111111-1': 'Ana Pérez',
}

// El qrToken es "<payloadBase64url>.<firma>". Decodificamos SOLO el payload
// (claims públicos) para enriquecer la tarjeta; la firma la valida el backend.
function decodeQrClaims(qrToken) {
  try {
    const payload = qrToken.split('.')[0]
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

export default function RoomReader() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const busyRef = useRef(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [result, setResult] = useState(null) // { ok, name, subjectId, time } | { ok:false, message }
  const [readerKey, setReaderKey] = useState(
    () => localStorage.getItem(READER_KEY_STORAGE) || DEFAULT_READER_KEY,
  )
  const [showConfig, setShowConfig] = useState(false)

  // Estado del respaldo simulado
  const [simRut, setSimRut] = useState(DEFAULT_SIM_RUT)
  const [simClasses, setSimClasses] = useState([])
  const [simClassId, setSimClassId] = useState('')
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState('')

  const persistReaderKey = (value) => {
    setReaderKey(value)
    localStorage.setItem(READER_KEY_STORAGE, value)
  }

  // ── Registro (compartido por cámara y simulación) ──────────────────────────
  const register = useCallback(
    async (qrToken) => {
      try {
        await registerAssistance(qrToken, readerKey)
        const claims = decodeQrClaims(qrToken)
        setResult({
          ok: true,
          name:
            (claims && KNOWN_NAMES[claims.studentRut]) ||
            claims?.studentRut ||
            'Estudiante',
          subjectId: claims?.subjectId ?? '',
          time: nowHHMM(),
        })
      } catch (e) {
        // 401 = reader key incorrecta: es el fallo más común en la demo (el
        // backend en Docker usa la READER_API_KEY de su .env, no la de dev).
        // Abrimos los ajustes y damos una pista accionable en vez del error
        // crudo del backend ("Credencial de lector inválida").
        if (e instanceof ApiError && e.status === 401) {
          setShowConfig(true)
          setResult({
            ok: false,
            message:
              'Reader key incorrecta. Ábrela en «Ajustes del lector» (abajo) y pega el valor de READER_API_KEY del backend.',
          })
          return
        }
        const message =
          e instanceof ApiError ? e.message : 'No se pudo registrar la asistencia'
        setResult({ ok: false, message })
      }
    },
    [readerKey],
  )

  // ── Cámara ──────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }, [])

  const tick = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const image = ctx.getImageData(0, 0, w, h)
    const code = jsQR(image.data, w, h, { inversionAttempts: 'dontInvert' })

    if (code && code.data && !busyRef.current) {
      busyRef.current = true
      stopCamera()
      register(code.data).finally(() => {
        busyRef.current = false
      })
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [register, stopCamera])

  const startCamera = useCallback(async () => {
    setCameraError('')
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setCameraOn(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setCameraError(
        'No se pudo abrir la cámara. Usa el modo simulación de abajo para continuar la demo.',
      )
    }
  }, [tick])

  useEffect(() => stopCamera, [stopCamera])

  // ── Respaldo simulado: carga las clases con registro abierto del estudiante
  // cuyo RUT se escribe en el campo (cualquier estudiante inscrito). ────────────
  const loadSimClasses = useCallback(async () => {
    if (!simRut.trim()) return
    setSimError('')
    try {
      const classes = await getStudentClassesWith(studentTokenFor(simRut))
      const open = classes.filter((c) => c.registrationStatus === 'ENABLED')
      setSimClasses(open)
      setSimClassId(open.length > 0 ? String(open[0].classId) : '')
      if (open.length === 0) {
        setSimError(
          'Ese estudiante no tiene clases con registro abierto (o el RUT no existe).',
        )
      }
    } catch (e) {
      setSimClasses([])
      setSimClassId('')
      setSimError(
        e instanceof ApiError
          ? `No se pudieron cargar las clases (${e.message}). ¿RUT correcto y backend con datos?`
          : 'No se pudieron cargar las clases.',
      )
    }
  }, [simRut])

  // Carga inicial para el RUT por defecto.
  useEffect(() => {
    loadSimClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const simulateScan = useCallback(async () => {
    if (!simClassId) return
    setSimLoading(true)
    setResult(null)
    try {
      // Reproduce el lado del estudiante: genera su QR real (CU-06)...
      const qr = await generateStudentQrWith(studentTokenFor(simRut), simClassId)
      // ...y lo pasa por el lector, igual que si lo hubiera escaneado la cámara.
      await register(qr.qrToken)
    } catch (e) {
      setResult({
        ok: false,
        message:
          e instanceof ApiError ? e.message : 'No se pudo simular el registro',
      })
    } finally {
      setSimLoading(false)
    }
  }, [simRut, simClassId, register])

  const scanAnother = () => {
    setResult(null)
    startCamera()
  }

  return (
    <div className="reader-shell">
      <div className="reader-brand">
        <strong>EasyCheck</strong>
        <span>Lector de sala</span>
      </div>

      {/* Tarjeta de resultado — el "momento" de la demo */}
      {result && (
        <div className={`reader-result ${result.ok ? 'ok' : 'err'}`}>
          {result.ok ? (
            <>
              <div className="reader-result-icon">✅</div>
              <div className="reader-result-title">Asistencia registrada</div>
              <div className="reader-result-body">
                {result.name}
                {result.subjectId ? ` · ${result.subjectId}` : ''}
              </div>
              <div className="reader-result-sub">Registrada {result.time}</div>
            </>
          ) : (
            <>
              <div className="reader-result-icon">⛔</div>
              <div className="reader-result-title">No se registró</div>
              <div className="reader-result-body">{result.message}</div>
            </>
          )}
          {result.ok ? (
            <button className="secondary" onClick={scanAnother}>
              Escanear otro
            </button>
          ) : (
            <button className="secondary" onClick={() => setResult(null)}>
              Volver
            </button>
          )}
        </div>
      )}

      {/* Cámara */}
      {!result && (
        <div className="reader-camera card">
          <div className="reader-video-wrap">
            <video ref={videoRef} playsInline muted className="reader-video" />
            {!cameraOn && (
              <div className="reader-video-placeholder">
                <div className="reader-target">▢</div>
                <p>Apunta la cámara al QR del estudiante</p>
              </div>
            )}
            {cameraOn && <div className="reader-scanline" />}
          </div>
          {!cameraOn ? (
            <button onClick={startCamera}>Encender cámara</button>
          ) : (
            <button className="secondary" onClick={stopCamera}>
              Apagar cámara
            </button>
          )}
          {cameraError && <p className="feedback error">{cameraError}</p>}
        </div>
      )}

      {/* Respaldo simulado */}
      {!result && (
        <div className="reader-sim card">
          <h2>— o simular escaneo —</h2>
          <p className="hint">
            Respaldo para la demo si la cámara falla. Escribe el RUT de cualquier
            estudiante inscrito, carga sus clases con registro abierto y registra
            su asistencia usando su QR real generado al vuelo.
          </p>
          <div className="inline-form">
            <input
              value={simRut}
              onChange={(e) => {
                setSimRut(e.target.value)
                setSimClasses([])
                setSimClassId('')
                setSimError('')
              }}
              placeholder="RUT del estudiante (11111111-1)"
            />
            <button
              className="secondary"
              onClick={loadSimClasses}
              disabled={!simRut.trim()}
            >
              Cargar clases
            </button>
          </div>
          {simError && <p className="feedback error">{simError}</p>}
          <div className="inline-form">
            <select
              value={simClassId}
              onChange={(e) => setSimClassId(e.target.value)}
              disabled={simClasses.length === 0}
            >
              {simClasses.length === 0 && (
                <option>Carga las clases del estudiante</option>
              )}
              {simClasses.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.subjectId} · Clase {c.classId} · {c.date}
                </option>
              ))}
            </select>
            <button
              onClick={simulateScan}
              disabled={simLoading || !simClassId}
            >
              {simLoading ? 'Registrando…' : 'Simular escaneo'}
            </button>
          </div>
        </div>
      )}

      {/* Ajustes (reader key) */}
      <div className="reader-config">
        <button className="linklike" onClick={() => setShowConfig((v) => !v)}>
          {showConfig ? 'Ocultar ajustes' : 'Ajustes del lector'}
        </button>
        {showConfig && (
          <div className="card">
            <label>
              Reader key (x-reader-key / READER_API_KEY del backend)
              <input
                value={readerKey}
                onChange={(e) => persistReaderKey(e.target.value)}
                placeholder={DEFAULT_READER_KEY}
              />
            </label>
            <p className="hint">
              Por defecto es la de desarrollo. Si el backend corre en Docker,
              pon aquí el valor de READER_API_KEY de su .env.
            </p>
          </div>
        )}
      </div>

      {/* canvas oculto usado para muestrear los fotogramas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
