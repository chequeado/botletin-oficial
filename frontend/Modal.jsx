// src/components/Modal.jsx
export default function Modal({ item, onClose }) {
  if (!item) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <span className={`tipo-badge ${item.tipo}`} style={{ marginBottom: 10, display: 'inline-block' }}>
          {item.tipoLabel}
        </span>
        <h2>{item.titulo}</h2>
        <div className="modal-meta">{item.organismo} · {item.fecha}</div>
        {item.texto?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        <button className="modal-btn">Ver publicación oficial →</button>
      </div>
    </div>
  )
}
