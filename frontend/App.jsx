// src/App.jsx
import { useState } from 'react'
import Feed     from './components/Feed'
import Busqueda from './components/Busqueda'
import Alertas  from './components/Alertas'

const PAGES = [
  { id: 'feed',     label: 'Feed del día' },
  { id: 'busqueda', label: 'Búsqueda' },
  { id: 'alertas',  label: 'Mis alertas' },
]

const today = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

export default function App() {
  const [page, setPage] = useState('feed')

  return (
    <>
      <header className="masthead">
        <div className="masthead-left">
          <div className="masthead-title">Bot<span>letín</span></div>
          <div className="masthead-sub">Transparencia del Boletín Oficial · República Argentina</div>
        </div>
        <div className="masthead-date">
          {today.charAt(0).toUpperCase() + today.slice(1)}<br />
          Núm. 35.621 · Primera Sección
        </div>
      </header>

      <nav className="nav-bar">
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-item${page === p.id ? ' active' : ''}`}
            onClick={() => setPage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {page === 'feed'     && <Feed />}
      {page === 'busqueda' && <Busqueda />}
      {page === 'alertas'  && <Alertas />}
    </>
  )
}
