// Mensaje de resultado de una operación (éxito o error de la API).
export default function Feedback({ feedback }) {
  if (!feedback) return null
  return (
    <p className={`feedback ${feedback.type}`} role="status">
      {feedback.text}
    </p>
  )
}
