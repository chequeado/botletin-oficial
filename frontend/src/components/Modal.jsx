// src/components/Modal.jsx
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

const TIPO_CHANGE_LABEL = {
  Alta:     'Designación',
  Baja:     'Baja / Renuncia',
  Prorroga: 'Prórroga',
}

export default function Modal({ item, onClose }) {
  if (!item) return null

  const changes = item.administrative_changes ?? []
  const altas    = changes.filter(c => c.tipo === 'Alta'     || c.tipo?.value === 'Alta')
  const bajas    = changes.filter(c => c.tipo === 'Baja'     || c.tipo?.value === 'Baja')
  const prorrogas= changes.filter(c => c.tipo === 'Prorroga' || c.tipo?.value === 'Prorroga')

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* ── Badges ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {item.categoria && (
            <span className={`tipo-badge ${item.categoria}`}>{item.categoria}</span>
          )}
          {item.tema && (
            <span className="tema-badge">{TEMA_LABELS[item.tema] ?? item.tema}</span>
          )}
          {item.score > 0 && (
            <span className="score-badge">★ {item.score}</span>
          )}
        </div>

        <h2>{item.titulo}</h2>

        <div className="modal-meta">
          {item.organismo} · {item.fecha}
          {item.tipo ? ` · ${item.tipo}` : ''}
        </div>

        {/* ── Resumen IA ── */}
        {item.resumen && (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)', marginBottom: 14 }}>
            {item.resumen}
          </p>
        )}

        {/* ── Cambios de personal ── */}
        {altas.length > 0 && (
          <PersonalSection title="Designaciones" items={altas} color="var(--green)" />
        )}
        {bajas.length > 0 && (
          <PersonalSection title="Bajas / Renuncias" items={bajas} color="var(--red)" />
        )}
        {prorrogas.length > 0 && (
          <PersonalSection title="Prórrogas" items={prorrogas} color="var(--blue)" />
        )}

        {/* ── Texto completo (colapsable si es largo) ── */}
        {item.texto_completo && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 11, color: 'var(--ink-muted)', cursor: 'pointer', marginBottom: 8 }}>
              Ver texto completo
            </summary>
            <div style={{ fontSize: 11, lineHeight: 1.75, color: 'var(--ink-mid)', whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
              {item.texto_completo}
            </div>
          </details>
        )}

        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <button className="modal-btn" style={{ marginTop: 16 }}>
            Ver publicación oficial →
          </button>
        </a>
      </div>
    </div>
  )
}

function PersonalSection({ title, items, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color, marginBottom: 6 }}>
        {title}
      </div>
      {items.map((c, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--ink-mid)', marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${color}` }}>
          <strong>{c.nombre}</strong>
          {c.cargo ? ` — ${c.cargo}` : ''}
          {c.dni ? <span style={{ color: 'var(--ink-faint)' }}> (DNI {c.dni})</span> : ''}
        </div>
      ))}
    </div>
  )
}