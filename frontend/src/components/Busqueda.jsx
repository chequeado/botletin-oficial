// src/components/Busqueda.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { searchResolutions } from '../api'
import Modal from './Modal'

// ── Constantes de filtro ─────────────────────────────────────
// "label" es lo que ve el usuario; "value" es lo que va a la API
const TIPOS = [
  { label: 'Todos',         value: '' },
  { label: 'Resolución',    value: 'Resolución' },
  { label: 'Decreto',       value: 'Decreto' },
  { label: 'Disposición',   value: 'Disposición' },
  { label: 'Licitaciones',  value: 'Licitaciones' },
]

const CATEGORIAS = [
  { label: 'Todas',         value: '' },
  { label: 'Personal',      value: 'personal' },
  { label: 'Normativa',     value: 'normativa' },
  { label: 'Licitaciones',  value: 'licitaciones' },
]

const TEMAS = [
  { label: 'Todos',           value: '' },
  { label: 'Política',        value: 'politica' },
  { label: 'Economía',        value: 'economia' },
  { label: 'Infraestructura', value: 'infraestructura' },
  { label: 'Salud',           value: 'salud' },
  { label: 'Justicia',        value: 'justicia' },
  { label: 'Educación',       value: 'educacion' },
]

// ── Helpers ──────────────────────────────────────────────────

function highlight(text = '', query = '') {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <em key={i} className="highlight">{part}</em>
      : part
  )
}

function Chip({ label, active, onClick }) {
  return (
    <span
      className={`filtro-chip${active ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {label}
    </span>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function Busqueda() {
  const [query,    setQuery]    = useState('')
  const [tipo,     setTipo]     = useState('')
  const [categoria,setCategoria]= useState('')
  const [tema,     setTema]     = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [modal,    setModal]    = useState(null)
  const debounceRef = useRef(null)

  // Búsqueda con debounce de 350ms para no saturar la API en cada tecla
  const doSearch = useCallback(async (q, t, cat, tem) => {
    setLoading(true)
    try {
      const data = await searchResolutions({ query: q, tipo: t, categoria: cat, tema: tem })
      setResults(data)
    } catch (err) {
      console.error('searchResolutions error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, tipo, categoria, tema)
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, tipo, categoria, tema, doSearch])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Archivo y búsqueda</h1>
        <small>Consulte el historial completo del Boletín Oficial</small>
      </div>

      {/* ── Buscador ── */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre, organismo, decreto, materia…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button className="search-btn" onClick={() => doSearch(query, tipo, categoria, tema)}>
          Buscar →
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="filtros">
        <span className="filtro-label">Tipo</span>
        {TIPOS.map(t => (
          <Chip key={t.value} label={t.label} active={tipo === t.value} onClick={() => setTipo(t.value)} />
        ))}

        <div className="filtro-sep" />

        <span className="filtro-label">Categoría</span>
        {CATEGORIAS.map(c => (
          <Chip key={c.value} label={c.label} active={categoria === c.value} onClick={() => setCategoria(c.value)} />
        ))}

        <div className="filtro-sep" />

        <span className="filtro-label">Tema</span>
        {TEMAS.map(t => (
          <Chip key={t.value} label={t.label} active={tema === t.value} onClick={() => setTema(t.value)} />
        ))}
      </div>

      {/* ── Conteo + estado ── */}
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>
        {loading
          ? 'Buscando…'
          : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
      </div>

      {/* ── Tabla de resultados ── */}
      <div className="results-header">
        <span>Fecha</span>
        <span>Publicación</span>
        <span>Organismo</span>
        <span>Tipo</span>
      </div>

      {results.map(item => (
        <div key={item.id} className="result-row" onClick={() => setModal(item)}>
          <div className="result-fecha">{item.fecha}</div>
          <div>
            <div className="result-titulo">{highlight(item.titulo, query)}</div>
            <div className="result-extracto">{highlight(item.resumen, query)}</div>
          </div>
          <div className="result-org">{item.organismo}</div>
          <div>
            <span className={`tipo-badge ${item.categoria}`} style={{ fontSize: 8 }}>
              {item.tipo}
            </span>
          </div>
        </div>
      ))}

      {!loading && results.length === 0 && (
        <div style={{ padding: '24px 8px', fontSize: 13, color: 'var(--ink-muted)' }}>
          {query || tipo || categoria || tema
            ? 'No se encontraron resultados para los filtros aplicados.'
            : 'Ingrese un término para buscar en el archivo.'}
        </div>
      )}

      {modal && <Modal item={modal} onClose={() => setModal(null)} />}
    </div>
  )
}