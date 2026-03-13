// src/components/Alertas.jsx
import { useState, useEffect } from 'react'
import { getAlertas, getHistorial, toggleAlerta } from '../api'

export default function Alertas() {
  const [alertas,   setAlertas]   = useState([])
  const [historial, setHistorial] = useState([])

  useEffect(() => {
    getAlertas().then(setAlertas)
    getHistorial().then(setHistorial)
  }, [])

  const handleToggle = async (id, current) => {
    const updated = await toggleAlerta(id, !current)
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: updated.activa } : a))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mis alertas</h1>
        <small>Reciba notificaciones cuando se publiquen temas de su interés</small>
      </div>

      <div className="sect-label">Suscripciones activas</div>

      <div className="alertas-grid">
        {alertas.map(a => (
          <div key={a.id} className="alerta-card">
            <div className="alerta-header">
              <div className="alerta-nombre">{a.nombre}</div>
              <button
                className={`toggle-switch${a.activa ? ' on' : ''}`}
                onClick={() => handleToggle(a.id, a.activa)}
                aria-label={a.activa ? 'Desactivar alerta' : 'Activar alerta'}
              />
            </div>
            <div className="alerta-desc">{a.desc}</div>
            <div className="alerta-tags">
              {a.tags.map(t => <span key={t} className="alerta-tag">{t}</span>)}
            </div>
            <div className="alerta-footer">
              <span className="alerta-canal">{a.canal}</span>
            </div>
          </div>
        ))}

        <button className="nueva-alerta">
          <span className="nueva-alerta-icono">＋</span>
          <span className="nueva-alerta-texto">Nueva alerta personalizada</span>
        </button>
      </div>

      <div className="sect-label">Notificaciones recientes</div>

      <div className="historial-head">
        <span>Fecha</span><span>Publicación</span><span>Alerta</span><span>Estado</span>
      </div>

      {historial.map((h, i) => (
        <div key={i} className="historial-row">
          <div className="h-fecha">{h.fecha}</div>
          <div className="h-titulo">{h.titulo}</div>
          <div className="h-alerta">{h.alerta}</div>
          <div><span className={`badge ${h.estado}`}>{h.estado === 'nueva' ? 'Nueva' : 'Leída'}</span></div>
        </div>
      ))}
    </div>
  )
}
