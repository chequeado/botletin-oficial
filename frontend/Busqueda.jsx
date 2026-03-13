// src/components/Busqueda.jsx
import { useState, useEffect } from 'react'
import { searchResolutions } from '../api'
import Modal from './Modal'

const TIPOS    = ['Todos', 'Designaciones', 'Renuncias', 'Decretos', 'Resoluciones', 'Licitaciones']
const PERIODOS = ['Hoy', 'Esta semana', 'Este mes', '2026']
const AREAS    = ['Todos', 'Economía', 'Interior', 'Salud', 'Justicia']

function Chip({ label, active, onClick }) {
  return (
    <span className={`filtro-chip${active ? ' active' : ''}`} onClick={onClick}>
      {label}
    </span>
  )
}

export default function Busqueda() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [modal,   setModal]   = useState(null)
  const [tipo,    setTipo]    = useState('Todos')
  const [periodo, setPeriodo] = useState('Hoy')
  const [area,    setArea]    = useState('Todos')

  useEffect(() => {
    searchResolutions({ query, tipo, area, periodo }).then(setResults)
  }, [query, tipo, area, periodo])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Archivo y búsqueda</h1>
        <small>Consulte el historial completo del Boletín Oficial</small>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre, organismo, decreto, materia…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="search-btn">Buscar →</button>
      </div>

      <div className="filtros">
        <span className="filtro-label">Tipo</span>
        {TIPOS.map(t => <Chip key={t} label={t} active={tipo === t} onClick={() => setTipo(t)} />)}
        <div className="filtro-sep" />
        <span className="filtro-label">Período</span>
        {PERIODOS.map(p => <Chip key={p} label={p} active={periodo === p} onClick={() => setPeriodo(p)} />)}
        <div className="filtro-sep" />
        <span className="filtro-label">Área</span>
        {AREAS.map(a => <Chip key={a} label={a} active={area === a} onClick={() => setArea(a)} />)}
      </div>

      <div className="results-header">
        <span>Fecha</span><span>Publicación</span><span>Organismo</span><span>Tipo</span>
      </div>

      {results.map((item) => (
        <div key={item.id} className="result-row" onClick={() => setModal(item)}>
          <div className="result-fecha">{item.fecha}</div>
          <div>
            <div className="result-titulo">{item.titulo}</div>
            <div className="result-extracto">{item.bajada}</div>
          </div>
          <div className="result-org">{item.organismo}</div>
          <div><span className={`tipo-badge ${item.tipo}`} style={{ fontSize: 8 }}>{item.tipoLabel}</span></div>
        </div>
      ))}

      {results.length === 0 && (
        <div style={{ padding: '20px 8px', fontSize: 13, color: 'var(--ink-muted)' }}>
          No se encontraron resultados.
        </div>
      )}

      {modal && <Modal item={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
