// src/components/Feed.jsx
import { useState, useEffect } from 'react'
import { getStats, getFeed } from '../api'
import Modal from './Modal'

const COLUMNS = [
  { key: 'personal',     label: 'Movimientos de personal' },
  { key: 'normativa',    label: 'Normativa y regulaciones' },
  { key: 'licitaciones', label: 'Licitaciones y contratos' },
]

const TEMA_LABELS = {
  politica:        'Política',
  justicia:        'Justicia',
  economia:        'Economía',
  infraestructura: 'Infraestructura',
  salud:           'Salud',
  educacion:       'Educación',
  medioambiente:   'Medio ambiente',
  sociedad:        'Sociedad',
  exterior:        'Exterior',
  defensa:         'Defensa',
}

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

  // El item destacado es el de mayor score
  const featured     = items[0]
  const byCategoria  = (key) => items.filter(i => i.categoria === key && i !== featured)

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
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <span className={`tipo-badge ${featured.categoria}`}>{featured.categoria}</span>
              {featured.tema && (
                <span className="tema-badge">{TEMA_LABELS[featured.tema] || featured.tema}</span>
              )}
              <span className="score-badge">★ {featured.score}</span>
            </div>
            <div className="featured-titulo">{featured.titulo}</div>
            <div className="aviso-bajada">{featured.resumen}</div>
            <div className="aviso-meta">{featured.organismo} · {featured.fecha}</div>
          </div>
        </div>
      )}

      <div className="feed-grid">
        {COLUMNS.map(col => (
          <div key={col.key}>
            <div className="feed-col-head">{col.label}</div>
            {byCategoria(col.key).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 0' }}>
                Sin publicaciones
              </div>
            )}
            {byCategoria(col.key).map(item => (
              <div key={item.id} className="aviso" onClick={() => setModal(item)}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                  <span className={`tipo-badge ${item.categoria}`}>{item.tipo}</span>
                  {item.tema && (
                    <span className="tema-badge">{TEMA_LABELS[item.tema] || item.tema}</span>
                  )}
                </div>
                <div className="aviso-titulo">{item.titulo}</div>
                <div className="aviso-bajada">{item.resumen}</div>
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