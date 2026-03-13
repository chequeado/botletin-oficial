// src/components/Alertas.jsx
import { useState, useEffect } from 'react'
import { getAlertas, getHistorial, toggleAlerta, deleteAlerta, createAlerta, updateAlerta, markLeida } from '../api'

// ── Opciones para el formulario ──────────────────────────────
const CANAL_OPTS     = ['email', 'telegram']
const FRECUENCIA_OPTS= ['inmediato', 'diario', 'semanal']
const TIPO_OPTS      = ['Decreto', 'Resolución', 'Resolución General', 'Disposición', 'Licitaciones']
const ORGANISMO_OPTS = ['AFIP', 'ANSES', 'PAMI', 'Banco Central', 'Min. Economía', 'Min. Interior', 'Min. Salud', 'Vialidad']

const FRECUENCIA_LABEL = { inmediato: 'Inmediato', diario: 'Diario', semanal: 'Semanal' }
const CANAL_ICON       = { email: '📧', telegram: '✈️' }

// ── Estado inicial del formulario ────────────────────────────
const EMPTY_FORM = {
  nombre:      '',
  descripcion: '',
  keywords:    [],   // array de strings
  tipos:       [],   // array de strings
  organismos:  [],   // array de strings
  canal:       'email',
  frecuencia:  'diario',
}

// ── Subcomponentes ───────────────────────────────────────────

function ToggleSwitch({ on, onToggle }) {
  return (
    <button
      className={`toggle-switch${on ? ' on' : ''}`}
      onClick={onToggle}
      aria-label={on ? 'Desactivar alerta' : 'Activar alerta'}
    />
  )
}

// Input de tags: escribe y presiona Enter o coma para agregar
function TagInput({ values, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !values.includes(val)) onChange([...values, val])
    setInput('')
  }

  const remove = (v) => onChange(values.filter(x => x !== v))

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 5, padding: '6px 8px', background: 'var(--bg-card)', display: 'flex', flexWrap: 'wrap', gap: 4, cursor: 'text' }}
         onClick={e => e.currentTarget.querySelector('input').focus()}>
      {values.map(v => (
        <span key={v} style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-hover)', color: 'var(--ink-mid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {v}
          <span style={{ cursor: 'pointer', opacity: .6, lineHeight: 1 }} onClick={() => remove(v)}>✕</span>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder={values.length === 0 ? placeholder : ''}
        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: 'var(--ink)', fontFamily: 'Inter, sans-serif', minWidth: 120, flex: 1 }}
      />
    </div>
  )
}

// Selector de múltiples opciones predefinidas (checkboxes visuales como chips)
function MultiChipSelect({ options, selected, onChange }) {
  const toggle = (opt) => {
    onChange(selected.includes(opt)
      ? selected.filter(x => x !== opt)
      : [...selected, opt]
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {options.map(opt => (
        <span
          key={opt}
          onClick={() => toggle(opt)}
          style={{
            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: selected.includes(opt) ? 'var(--ink)' : 'var(--bg-card)',
            color:      selected.includes(opt) ? 'var(--bg)'  : 'var(--ink-mid)',
            transition: 'all .12s',
          }}
        >
          {opt}
        </span>
      ))}
    </div>
  )
}

// Modal de creación/edición de alerta
function AlertaModal({ onClose, onSave, initial = null }) {
  const [form, setForm]     = useState(initial ?? EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (form.keywords.length === 0 && form.tipos.length === 0 && form.organismos.length === 0) {
      setError('Agregá al menos una palabra clave, tipo u organismo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (e) {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 560 }}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 style={{ marginBottom: 4 }}>{initial ? 'Editar alerta' : 'Nueva alerta'}</h2>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 18 }}>
          Recibí una notificación cada vez que se publique algo que coincida con los criterios.
        </p>

        {/* Nombre */}
        <Field label="Nombre *">
          <input
            type="text"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Designaciones en Ministerio de Salud"
            style={inputStyle}
          />
        </Field>

        {/* Descripción */}
        <Field label="Descripción (opcional)">
          <textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Qué tipo de publicaciones querés monitorear"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>

        {/* Keywords */}
        <Field label="Palabras clave" hint="Presioná Enter o coma para agregar">
          <TagInput
            values={form.keywords}
            onChange={v => set('keywords', v)}
            placeholder="Ej: AFIP, exportaciones, habilitación…"
          />
        </Field>

        {/* Tipos */}
        <Field label="Tipos de publicación">
          <MultiChipSelect options={TIPO_OPTS} selected={form.tipos} onChange={v => set('tipos', v)} />
        </Field>

        {/* Organismos */}
        <Field label="Organismos" hint="Seleccioná de la lista o escribí uno con Enter">
          <MultiChipSelect options={ORGANISMO_OPTS} selected={form.organismos} onChange={v => set('organismos', v)} />
          <div style={{ marginTop: 6 }}>
            <TagInput
              values={form.organismos.filter(o => !ORGANISMO_OPTS.includes(o))}
              onChange={v => set('organismos', [...ORGANISMO_OPTS.filter(o => form.organismos.includes(o)), ...v])}
              placeholder="Otro organismo…"
            />
          </div>
        </Field>

        {/* Canal + Frecuencia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Canal de notificación">
            <select value={form.canal} onChange={e => set('canal', e.target.value)} style={inputStyle}>
              {CANAL_OPTS.map(c => <option key={c} value={c}>{CANAL_ICON[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Frecuencia">
            <select value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)} style={inputStyle}>
              {FRECUENCIA_OPTS.map(f => <option key={f} value={f}>{FRECUENCIA_LABEL[f]}</option>)}
            </select>
          </Field>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="modal-btn">
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear alerta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Wrapper de campo con label y hint opcional
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mid)', letterSpacing: '.3px' }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Estilos reutilizables ────────────────────────────────────
const inputStyle = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 5,
  padding: '8px 10px', fontSize: 12, fontFamily: 'Inter, sans-serif',
  color: 'var(--ink)', background: 'var(--bg-card)', outline: 'none',
}
const secondaryBtnStyle = {
  fontSize: 12, fontWeight: 500, padding: '9px 18px', borderRadius: 5,
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--ink-muted)', cursor: 'pointer',
}

// ── Componente principal ─────────────────────────────────────
export default function Alertas() {
  const [alertas,    setAlertas]    = useState([])
  const [historial,  setHistorial]  = useState([])
  const [showModal,  setShowModal]  = useState(false)  // true = crear nueva
  const [editTarget, setEditTarget] = useState(null)   // alerta a editar
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([getAlertas(), getHistorial()]).then(([a, h]) => {
      setAlertas(a)
      setHistorial(h)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (id, current) => {
    // Optimistic update
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: !current } : a))
    try {
      const updated = await toggleAlerta(id, !current)
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: updated.activa } : a))
    } catch {
      // Rollback
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: current } : a))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta alerta?')) return
    setAlertas(prev => prev.filter(a => a.id !== id))
    try {
      await deleteAlerta(id)
    } catch (e) {
      console.error('Error eliminando alerta:', e)
    }
  }

  const handleCreate = async (form) => {
    const created = await createAlerta(form)
    setAlertas(prev => [...prev, created])
  }

  const handleMarkLeida = async (notifId) => {
    setHistorial(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n))
    try { await markLeida(notifId) } catch (e) { console.error(e) }
  }

  const nuevas = historial.filter(n => !n.leida).length

  if (loading) return <div className="page" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Cargando...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mis alertas</h1>
        <small>Recibí notificaciones cuando se publiquen temas de tu interés</small>
      </div>

      {/* ── Sección: suscripciones ── */}
      <div className="sect-label">
        Suscripciones activas
        <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>
          {alertas.filter(a => a.activa).length} de {alertas.length}
        </span>
      </div>

      <div className="alertas-grid">
        {alertas.map(a => (
          <div key={a.id} className="alerta-card">
            <div className="alerta-header">
              <div className="alerta-nombre">{a.nombre}</div>
              <ToggleSwitch on={a.activa} onToggle={() => handleToggle(a.id, a.activa)} />
            </div>

            {a.descripcion && (
              <div className="alerta-desc">{a.descripcion}</div>
            )}

            <div className="alerta-tags">
              {(a.keywords ?? []).map(t => (
                <span key={t} className="alerta-tag">{t}</span>
              ))}
              {(a.tipos ?? []).map(t => (
                <span key={t} className="alerta-tag" style={{ background: '#f0ede5', color: 'var(--ink-mid)' }}>{t}</span>
              ))}
              {(a.organismos ?? []).map(o => (
                <span key={o} className="alerta-tag" style={{ background: '#e8ecf4', color: 'var(--blue)' }}>{o}</span>
              ))}
            </div>

            <div className="alerta-footer">
              <span className="alerta-canal">
                {CANAL_ICON[a.canal]} {a.canal} · {FRECUENCIA_LABEL[a.frecuencia] ?? a.frecuencia}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditTarget(a)}
                  style={{ fontSize: 10, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ fontSize: 10, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Botón nueva alerta */}
        <button className="nueva-alerta" onClick={() => setShowModal(true)}>
          <span className="nueva-alerta-icono">＋</span>
          <span className="nueva-alerta-texto">Nueva alerta personalizada</span>
        </button>
      </div>

      {/* ── Sección: historial ── */}
      <div className="sect-label">
        Notificaciones recientes
        {nuevas > 0 && (
          <span style={{ fontSize: 10, background: '#e8f4ec', color: 'var(--green)', padding: '1px 7px', borderRadius: 20, fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
            {nuevas} nueva{nuevas !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {historial.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '12px 0' }}>
          No hay notificaciones todavía.
        </div>
      ) : (
        <>
          <div className="historial-head">
            <span>Fecha</span>
            <span>Publicación</span>
            <span>Alerta</span>
            <span>Estado</span>
          </div>

          {historial.map(n => (
            <div
              key={n.id}
              className="historial-row"
              onClick={() => !n.leida && handleMarkLeida(n.id)}
              style={{ cursor: n.leida ? 'default' : 'pointer' }}
            >
              <div className="h-fecha">{n.fecha}</div>
              <div className="h-titulo">{n.resolution_titulo ?? '—'}</div>
              <div className="h-alerta">{n.alerta_nombre ?? '—'}</div>
              <div>
                <span className={`badge ${n.leida ? 'leida' : 'nueva'}`}>
                  {n.leida ? 'Leída' : 'Nueva'}
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Modales ── */}
      {showModal && (
        <AlertaModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      {editTarget && (
        <AlertaModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (form) => {
            const updated = await updateAlerta(editTarget.id, form)
            setAlertas(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...updated } : a))
          }}
        />
      )}
    </div>
  )
}