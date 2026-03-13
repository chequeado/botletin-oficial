// src/components/Feed.jsx
import { useState, useEffect } from 'react'
import { getStats, getFeed } from '../api'
import Modal from './Modal'

const COLUMNS = [
  { key: 'personal',    label: 'Movimientos de personal' },
  { key: 'normativa',   label: 'Normativa y regulaciones' },
  { key: 'licitaciones',label: 'Licitaciones y contratos' },
]

export default function Feed() {
  const [stats,   setStats]   = useState(null)
  const [items,   setItems]   = useState([])
  const [modal,   setModal]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getFeed()]).then(([s, f]) => {
      setStats(s)
      setItems(f)
      setLoading(false)
    })
  }, [])

  const featured  = items.find(i => i.destacado)
  const byColumna = (key) => items.filter(i => i.columna === key)

  if (loading) return <div className="page" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Cargando...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Edición del día</h1>
        <small>Publicaciones de hoy — extraídas y clasificadas automáticamente</small>
      </div>

      {stats && (
        <div className="stats-row">
          <div className="stat-pill"><span className="num num-gold">{stats.total}</span><span className="lbl">Publicaciones<br/>totales</span></div>
          <div className="stat-pill"><span className="num num-green">{stats.designaciones}</span><span className="lbl">Designaciones</span></div>
          <div className="stat-pill"><span className="num num-red">{stats.bajas}</span><span className="lbl">Bajas</span></div>
          <div className="stat-pill"><span className="num num-blue">{stats.prorrogas}</span><span className="lbl">Prórrogas</span></div>
          <div className="stat-pill"><span className="num" style={{ color: 'var(--ink-mid)' }}>{stats.decretos}</span><span className="lbl">Decretos &<br/>Resoluciones</span></div>
        </div>
      )}

      {featured && (
        <div className="featured-item" onClick={() => setModal(featured)}>
          <div>
            <span className={`tipo-badge ${featured.tipo}`}>{featured.tipoLabel}</span>
            <div className="featured-titulo">{featured.titulo}</div>
            <div className="aviso-bajada">{featured.bajada}</div>
            <div className="aviso-meta">{featured.organismo} · {featured.fecha}</div>
          </div>
          <div className="aviso-num-big">{featured.numero}</div>
        </div>
      )}

      <div className="feed-grid">
        {COLUMNS.map(col => (
          <div key={col.key}>
            <div className="feed-col-head">{col.label}</div>
            {byColumna(col.key).map(item => (
              <div key={item.id} className="aviso" onClick={() => setModal(item)}>
                <span className={`tipo-badge ${item.tipo}`}>{item.tipoLabel}</span>
                <div className="aviso-titulo">{item.titulo}</div>
                <div className="aviso-bajada">{item.bajada}</div>
                <div className="aviso-meta">{item.organismo} · {item.fecha}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal && <Modal item={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
