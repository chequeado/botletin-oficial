// src/api.js
// ─────────────────────────────────────────────────────────────
// Swap USE_MOCK = false to hit the real FastAPI backend.
// All components import from here — never fetch directly.
// ─────────────────────────────────────────────────────────────

const USE_MOCK = false
const BASE = '/api'

// ── Mock data ────────────────────────────────────────────────

const MOCK_STATS = {
  total: 142,
  designaciones: 38,
  bajas: 21,
  prorrogas: 14,
  decretos: 69,
}

const MOCK_FEED = [
  {
    id: 'dec747',
    tipo: 'Decretos',
    tipoLabel: 'Decreto destacado',
    categoria: 'normativa',
    tema: 'politica',
    titulo: 'Decreto 747/2026 — Reestructuración del Ministerio de Economía',
    resumen: 'El Ejecutivo dispuso la fusión de la Secretaría de Hacienda con la de Presupuesto, creando una nueva Secretaría de Gestión Fiscal.',
    organismo: 'Min. Economía',
    fecha: '13/03/2026',
    score: 90,
    destacado: true,
    url: '#',
  },
  {
    id: 'des1', tipo: 'Resolución', tipoLabel: 'Designación', categoria: 'personal', tema: 'politica',
    titulo: 'Mariana Soledad Figueroa — Subsecretaria de Asuntos Públicos',
    resumen: 'Designación interina. Min. del Interior. Res. 210/2026.',
    organismo: 'Interior', fecha: '13/03/2026', score: 75, url: '#',
  },
  {
    id: 'ren1', tipo: 'Resolución', tipoLabel: 'Baja', categoria: 'personal', tema: 'infraestructura',
    titulo: 'Gonzalo Pérez Vilar — Director Nacional de Infraestructura',
    resumen: 'Renuncia aceptada. Decreto 748/2026.',
    organismo: 'Obras Públicas', fecha: '13/03/2026', score: 65, url: '#',
  },
  {
    id: 'res1', tipo: 'Resolución General', tipoLabel: 'Resolución', categoria: 'normativa', tema: 'economia',
    titulo: 'Nuevas tablas arancelarias — Res. 78/2026',
    resumen: 'Actualización de 234 posiciones arancelarias del nomenclador SIM.',
    organismo: 'Comercio', fecha: '13/03/2026', score: 60, url: '#',
  },
  {
    id: 'lic1', tipo: 'Licitaciones', tipoLabel: 'Licitación', categoria: 'licitaciones', tema: 'infraestructura',
    titulo: 'Licitación internacional — Corredor vial Ruta 3 (tramos 15–19)',
    resumen: 'Presupuesto estimado: USD 840M. Apertura: 15/04/2026.',
    organismo: 'Vialidad', fecha: '13/03/2026', score: 85, url: '#',
  },
]

const MOCK_ALERTAS = [
  { id: 1, nombre: 'Movimientos de personal ejecutivo', desc: 'Designaciones y renuncias de cargos de Secretario o superior en todos los ministerios nacionales.', tags: ['designaciones', 'renuncias', 'ministerios'], canal: '📧 Email · diario · 07:00 hs', activa: true },
  { id: 2, nombre: 'Licitaciones obras públicas', desc: 'Llamados a licitación pública nacional e internacional en obras de infraestructura vial y edilicia.', tags: ['licitaciones', 'vialidad', 'contratos'], canal: '📧 Email · inmediato', activa: true },
  { id: 3, nombre: 'Regulación de medios digitales', desc: 'Decretos y resoluciones sobre plataformas digitales, telecomunicaciones y medios de comunicación.', tags: ['decretos', 'telecomunicaciones', 'medios'], canal: '✉ Telegram · en tiempo real', activa: true },
  { id: 4, nombre: 'AFIP — normativa tributaria', desc: 'Resoluciones generales de AFIP sobre impuestos, regímenes de retención y actualización de alícuotas.', tags: ['AFIP', 'impuestos', 'monotributo'], canal: '📧 Email · semanal · lunes', activa: false },
  { id: 5, nombre: 'Decretos de necesidad y urgencia', desc: 'Todos los DNU firmados por el Poder Ejecutivo nacional, con resumen automático generado por IA.', tags: ['DNU', 'poder ejecutivo', 'urgencia'], canal: '✉ Telegram · inmediato', activa: true },
]

const MOCK_HISTORIAL = [
  { fecha: 'Hoy 08:14', titulo: 'Designación — Mariana S. Figueroa, Subsecretaria de Asuntos Públicos', alerta: 'Mvtos. Personal', estado: 'nueva' },
  { fecha: 'Hoy 08:14', titulo: 'Baja — Gonzalo Pérez Vilar, Dir. Nacional de Infraestructura', alerta: 'Mvtos. Personal', estado: 'nueva' },
  { fecha: 'Hoy 08:14', titulo: 'DNU 747/2026 — Reestructuración Min. Economía', alerta: 'DNU', estado: 'nueva' },
  { fecha: 'Ayer 07:02', titulo: 'Licitación — Corredor vial Ruta 3, tramos 15–19', alerta: 'Licitaciones', estado: 'leida' },
  { fecha: 'Ayer 07:02', titulo: 'Decreto — Regulación plataformas digitales', alerta: 'Medios Digitales', estado: 'leida' },
]

// ── API functions ────────────────────────────────────────────

export async function getStats() {
  if (USE_MOCK) return MOCK_STATS
  const r = await fetch(`${BASE}/stats`)
  return r.json()
}

export async function getFeed(fecha) {
  if (USE_MOCK) return MOCK_FEED
  const params = fecha ? `?fecha=${fecha}` : ''
  const r = await fetch(`${BASE}/resolutions/${params}`)
  const items = await r.json()
  // Ordenar por score descendente
  return items.sort((a, b) => b.score - a.score)
}

export async function searchResolutions({ query, tipo, area, periodo } = {}) {
  if (USE_MOCK) {
    return MOCK_FEED.filter(item =>
      !query || item.titulo.toLowerCase().includes(query.toLowerCase())
    )
  }
  const params = new URLSearchParams()
  if (query)   params.set('q', query)
  if (tipo)    params.set('tipo', tipo)
  if (area)    params.set('area', area)
  if (periodo) params.set('periodo', periodo)
  const r = await fetch(`${BASE}/resolutions/search?${params}`)
  return r.json()
}

export async function getAlertas() {
  if (USE_MOCK) return MOCK_ALERTAS
  const r = await fetch(`${BASE}/alertas`)
  return r.json()
}

export async function getHistorial() {
  if (USE_MOCK) return MOCK_HISTORIAL
  const r = await fetch(`${BASE}/alertas/historial`)
  return r.json()
}

export async function toggleAlerta(id, activa) {
  if (USE_MOCK) return { id, activa }
  const r = await fetch(`${BASE}/alertas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activa }),
  })
  return r.json()
}