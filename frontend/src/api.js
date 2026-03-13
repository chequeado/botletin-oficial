// frontend/src/api.js
// ─────────────────────────────────────────────────────────────
// En desarrollo: cambiá USE_MOCK_OVERRIDE a true/false manualmente.
// En el build de GH Pages: el workflow setea VITE_USE_MOCK=true
// y Vite lo inyecta en build time vía import.meta.env.
// ─────────────────────────────────────────────────────────────

const USE_MOCK_OVERRIDE = false   // ← toggle manual para desarrollo local
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || USE_MOCK_OVERRIDE

const BASE = '/api'

// ── Mock data ────────────────────────────────────────────────

const MOCK_STATS = {
  total: 142, designaciones: 38, bajas: 21, prorrogas: 14, decretos: 69,
}

const MOCK_FEED = [
  { id: 'dec747', tipo: 'Decretos', tipoLabel: 'Decreto destacado', categoria: 'normativa', tema: 'politica', titulo: 'Decreto 747/2026 — Reestructuración del Ministerio de Economía', resumen: 'El Ejecutivo dispuso la fusión de la Secretaría de Hacienda con la de Presupuesto, creando una nueva Secretaría de Gestión Fiscal.', organismo: 'Min. Economía', fecha: '13/03/2026', score: 90, url: '#', administrative_changes: [] },
  { id: 'des1', tipo: 'Resolución', tipoLabel: 'Designación', categoria: 'personal', tema: 'politica', titulo: 'Mariana Soledad Figueroa — Subsecretaria de Asuntos Públicos', resumen: 'Designación interina. Min. del Interior. Res. 210/2026.', organismo: 'Interior', fecha: '13/03/2026', score: 75, url: '#', administrative_changes: [{ tipo: 'Alta', nombre: 'Mariana Soledad Figueroa', cargo: 'Subsecretaria de Asuntos Públicos', dni: '28.111.222' }] },
  { id: 'ren1', tipo: 'Resolución', tipoLabel: 'Baja', categoria: 'personal', tema: 'infraestructura', titulo: 'Gonzalo Pérez Vilar — Director Nacional de Infraestructura', resumen: 'Renuncia aceptada. Decreto 748/2026.', organismo: 'Obras Públicas', fecha: '13/03/2026', score: 65, url: '#', administrative_changes: [{ tipo: 'Baja', nombre: 'Gonzalo Pérez Vilar', cargo: 'Director Nacional de Infraestructura', dni: '22.555.666' }] },
  { id: 'res1', tipo: 'Resolución General', tipoLabel: 'Resolución', categoria: 'normativa', tema: 'economia', titulo: 'Nuevas tablas arancelarias — Res. 78/2026', resumen: 'Actualización de 234 posiciones arancelarias del nomenclador SIM.', organismo: 'Comercio', fecha: '13/03/2026', score: 60, url: '#', administrative_changes: [] },
  { id: 'lic1', tipo: 'Licitaciones', tipoLabel: 'Licitación', categoria: 'licitaciones', tema: 'infraestructura', titulo: 'Licitación internacional — Corredor vial Ruta 3 (tramos 15–19)', resumen: 'Presupuesto estimado: USD 840M. Apertura: 15/04/2026.', organismo: 'Vialidad', fecha: '13/03/2026', score: 85, url: '#', administrative_changes: [] },
]

const MOCK_ALERTAS = [
  { id: 1, nombre: 'Movimientos de personal ejecutivo', descripcion: 'Designaciones y renuncias de cargos de Secretario o superior.', keywords: ['designaciones', 'renuncias', 'ministerios'], tipos: [], organismos: [], canal: 'email', frecuencia: 'diario', activa: true },
  { id: 2, nombre: 'Licitaciones obras públicas', descripcion: 'Llamados a licitación pública nacional e internacional.', keywords: ['licitaciones', 'vialidad', 'contratos'], tipos: ['Licitaciones'], organismos: [], canal: 'email', frecuencia: 'inmediato', activa: true },
  { id: 3, nombre: 'Regulación de medios digitales', descripcion: 'Decretos y resoluciones sobre plataformas digitales y telecomunicaciones.', keywords: ['decretos', 'telecomunicaciones', 'medios'], tipos: ['Decreto'], organismos: [], canal: 'telegram', frecuencia: 'inmediato', activa: true },
  { id: 4, nombre: 'AFIP — normativa tributaria', descripcion: 'Resoluciones generales de AFIP sobre impuestos y alícuotas.', keywords: ['AFIP', 'impuestos', 'monotributo'], tipos: [], organismos: ['AFIP'], canal: 'email', frecuencia: 'semanal', activa: false },
]

const MOCK_HISTORIAL = [
  { id: 1, alerta_id: 1, resolution_id: 2, fecha: '2026-03-13', leida: false, alerta_nombre: 'Personal ejecutivo', resolution_titulo: 'Mariana S. Figueroa, Subsecretaria de Asuntos Públicos' },
  { id: 2, alerta_id: 1, resolution_id: 3, fecha: '2026-03-13', leida: false, alerta_nombre: 'Personal ejecutivo', resolution_titulo: 'Gonzalo Pérez Vilar, Dir. Nacional de Infraestructura' },
  { id: 3, alerta_id: 3, resolution_id: 1, fecha: '2026-03-13', leida: true,  alerta_nombre: 'Medios digitales',   resolution_titulo: 'DNU 747/2026 — Reestructuración Min. Economía' },
]

// ── API functions ────────────────────────────────────────────

export async function getStats() {
  if (USE_MOCK) return MOCK_STATS
  const r = await fetch(`${BASE}/stats`)
  if (!r.ok) throw new Error(`GET /stats → ${r.status}`)
  return r.json()
}

export async function getFeed(fecha) {
  if (USE_MOCK) return MOCK_FEED
  const params = fecha ? `?fecha=${fecha}` : ''
  const r = await fetch(`${BASE}/resolutions/${params}`)
  if (!r.ok) throw new Error(`GET /resolutions/ → ${r.status}`)
  const items = await r.json()
  return items.sort((a, b) => b.score - a.score)
}

export async function searchResolutions({ query = '', tipo = '', categoria = '', tema = '' } = {}) {
  if (USE_MOCK) {
    return MOCK_FEED.filter(item => {
      const matchQ    = !query     || item.titulo.toLowerCase().includes(query.toLowerCase()) || item.resumen.toLowerCase().includes(query.toLowerCase()) || item.organismo.toLowerCase().includes(query.toLowerCase())
      const matchT    = !tipo      || item.tipo === tipo
      const matchCat  = !categoria || item.categoria === categoria
      const matchTema = !tema      || item.tema === tema
      return matchQ && matchT && matchCat && matchTema
    })
  }
  const params = new URLSearchParams()
  if (query)     params.set('q',         query)
  if (tipo)      params.set('tipo',      tipo)
  if (categoria) params.set('categoria', categoria)
  if (tema)      params.set('tema',      tema)
  const r = await fetch(`${BASE}/resolutions/search?${params}`)
  if (!r.ok) throw new Error(`GET /resolutions/search → ${r.status}`)
  return r.json()
}

export async function getAlertas() {
  if (USE_MOCK) return MOCK_ALERTAS
  const r = await fetch(`${BASE}/alertas`)
  if (!r.ok) throw new Error(`GET /alertas → ${r.status}`)
  return r.json()
}

export async function createAlerta(payload) {
  if (USE_MOCK) return { id: Date.now(), ...payload, activa: true }
  const r = await fetch(`${BASE}/alertas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`POST /alertas → ${r.status}`)
  return r.json()
}

export async function updateAlerta(id, payload) {
  if (USE_MOCK) return { id, ...payload }
  const r = await fetch(`${BASE}/alertas/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`PUT /alertas/${id} → ${r.status}`)
  return r.json()
}

export async function toggleAlerta(id, activa) {
  if (USE_MOCK) return { id, activa }
  const r = await fetch(`${BASE}/alertas/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activa }),
  })
  if (!r.ok) throw new Error(`PATCH /alertas/${id} → ${r.status}`)
  return r.json()
}

export async function deleteAlerta(id) {
  if (USE_MOCK) return
  const r = await fetch(`${BASE}/alertas/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error(`DELETE /alertas/${id} → ${r.status}`)
}

export async function getHistorial(limit = 50) {
  if (USE_MOCK) return MOCK_HISTORIAL
  const r = await fetch(`${BASE}/alertas/historial?limit=${limit}`)
  if (!r.ok) throw new Error(`GET /alertas/historial → ${r.status}`)
  return r.json()
}

export async function markLeida(notifId) {
  if (USE_MOCK) return { id: notifId, leida: true }
  const r = await fetch(`${BASE}/alertas/historial/${notifId}/leida`, { method: 'PATCH' })
  if (!r.ok) throw new Error(`PATCH /alertas/historial/${notifId}/leida → ${r.status}`)
  return r.json()
}