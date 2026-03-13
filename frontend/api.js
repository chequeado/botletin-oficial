// src/api.js
// ─────────────────────────────────────────────────────────────
// Swap USE_MOCK = false to hit the real FastAPI backend.
// All components import from here — never fetch directly.
// ─────────────────────────────────────────────────────────────

const USE_MOCK = true
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
    tipo: 'decreto',
    tipoLabel: 'Decreto destacado',
    titulo: 'Decreto 747/2026 — Reestructuración del Ministerio de Economía',
    bajada: 'El Ejecutivo dispuso la fusión de la Secretaría de Hacienda con la de Presupuesto, creando una nueva Secretaría de Gestión Fiscal.',
    organismo: 'Min. Economía',
    fecha: '13/03/2026',
    numero: '747',
    destacado: true,
    texto: 'El Poder Ejecutivo Nacional dispuso la fusión de la Secretaría de Hacienda y la Secretaría de Presupuesto, creando en su reemplazo la Secretaría de Gestión Fiscal.\n\nLa nueva secretaría tendrá a su cargo la elaboración del Presupuesto General de la Administración Pública Nacional. Vigencia: 1 de abril de 2026.',
  },
  {
    id: 'des1', tipo: 'designacion', tipoLabel: 'Designación', columna: 'personal',
    titulo: 'Mariana Soledad Figueroa — Subsecretaria de Asuntos Públicos',
    bajada: 'Designación interina. Min. del Interior. Res. 210/2026.',
    organismo: 'Interior', fecha: '13/03/2026',
    texto: 'Se designa con carácter interino a la Lic. Mariana Soledad Figueroa (DNI 28.441.209) en el cargo de Subsecretaria de Asuntos Públicos, con retención de su cargo de origen.',
  },
  {
    id: 'ren1', tipo: 'renuncia', tipoLabel: 'Baja', columna: 'personal',
    titulo: 'Gonzalo Pérez Vilar — Director Nacional de Infraestructura',
    bajada: 'Renuncia aceptada. Decreto 748/2026.',
    organismo: 'Obras Públicas', fecha: '13/03/2026',
    texto: 'Se acepta la renuncia presentada por el Ing. Gonzalo Pérez Vilar (DNI 22.108.445) al cargo de Director Nacional de Infraestructura. El Poder Ejecutivo le expresa su reconocimiento.',
  },
  {
    id: 'des2', tipo: 'designacion', tipoLabel: 'Designación', columna: 'personal',
    titulo: 'Carlos Alberto Méndez — Director de Auditoría AFIP',
    bajada: 'Cargo de planta permanente. Res. Gral. 5210.',
    organismo: 'AFIP', fecha: '13/03/2026',
    texto: 'Se designa con carácter permanente al Lic. Carlos Alberto Méndez (DNI 20.901.330) en el cargo de Director de Auditoría Interna de la AFIP.',
  },
  {
    id: 'pro1', tipo: 'prorroga', tipoLabel: 'Prórroga', columna: 'personal',
    titulo: 'Andrea Liliana Castro — Interventora PAMI',
    bajada: 'Prórroga por 180 días. Decreto 749/2026.',
    organismo: 'PAMI', fecha: '13/03/2026',
    texto: 'Se prorroga por 180 días la intervención del PAMI a cargo de la Dra. Andrea Liliana Castro, a efectos de completar el proceso de normalización institucional.',
  },
  {
    id: 'res1', tipo: 'resolucion', tipoLabel: 'Resolución', columna: 'normativa',
    titulo: 'Nuevas tablas arancelarias — Res. 78/2026',
    bajada: 'Actualización de 234 posiciones arancelarias del nomenclador SIM.',
    organismo: 'Comercio', fecha: '13/03/2026',
    texto: 'Se aprueban nuevas tablas de Derechos de Importación para 234 posiciones del nomenclador SIM. Vigencia: 1 de abril de 2026.',
  },
  {
    id: 'res2', tipo: 'decreto', tipoLabel: 'Decreto', columna: 'normativa',
    titulo: 'Regulación plataformas digitales — Decreto 750/2026',
    bajada: 'Cuota del 30% de contenido local para plataformas con +500.000 usuarios.',
    organismo: 'Cultura', fecha: '13/03/2026',
    texto: 'Se establece la obligación de incorporar un mínimo del 30% de contenido nacional en el catálogo de plataformas con más de 500.000 usuarios activos mensuales.',
  },
  {
    id: 'res3', tipo: 'resolucion', tipoLabel: 'Resolución', columna: 'normativa',
    titulo: 'Prórroga de emergencia sanitaria — Min. Salud',
    bajada: 'Extensión por 90 días en provincias de alta densidad.',
    organismo: 'Salud', fecha: '13/03/2026',
    texto: 'Se prorroga por noventa días la declaración de emergencia sanitaria en las provincias de Buenos Aires, Córdoba y Santa Fe.',
  },
  {
    id: 'lic1', tipo: 'licitacion', tipoLabel: 'Licitación', columna: 'licitaciones',
    titulo: 'Licitación internacional — Corredor vial Ruta 3 (tramos 15–19)',
    bajada: 'Presupuesto estimado: USD 840M. Apertura: 15/04/2026.',
    organismo: 'Vialidad', fecha: '13/03/2026',
    texto: 'Se llama a Licitación Pública Internacional para obras de repavimentación entre los km 623 y 847.\n\nPresupuesto oficial: USD 840.000.000. Apertura: 15/04/2026 a las 11:00 hs.',
  },
  {
    id: 'con1', tipo: 'resolucion', tipoLabel: 'Contrato', columna: 'licitaciones',
    titulo: 'Adjudicación equipamiento hospitalario — 14 provincias',
    bajada: 'Contrato directo por $2.300M. MedTech Argentina S.A.',
    organismo: 'Salud', fecha: '13/03/2026',
    texto: 'Se aprueba la contratación directa con MedTech Argentina S.A. para suministro e instalación de equipamiento de diagnóstico en 47 hospitales. Monto: $2.300.000.000.',
  },
  {
    id: 'lic2', tipo: 'licitacion', tipoLabel: 'Concesión', columna: 'licitaciones',
    titulo: 'Servicio postal universal — llamado a concurso',
    bajada: 'Vigencia: 10 años. Plazo: 30 días hábiles desde publicación.',
    organismo: 'Comunicaciones', fecha: '13/03/2026',
    texto: 'Se llama a concurso público para la concesión del Servicio Postal Universal por 10 años. Plazo de presentación: 30 días hábiles.',
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
// When USE_MOCK = false these hit /api/* (proxied to FastAPI)

export async function getStats() {
  if (USE_MOCK) return MOCK_STATS
  const r = await fetch(`${BASE}/stats`)
  return r.json()
}

export async function getFeed(fecha) {
  if (USE_MOCK) return MOCK_FEED
  const params = fecha ? `?fecha=${fecha}` : ''
  const r = await fetch(`${BASE}/resolutions/${params}`)
  return r.json()
}

export async function searchResolutions({ query, tipo, area, periodo } = {}) {
  if (USE_MOCK) {
    // Simple client-side mock filter
    return MOCK_FEED.filter(item =>
      !query || item.titulo.toLowerCase().includes(query.toLowerCase())
    )
  }
  const params = new URLSearchParams({ q: query, tipo, area, periodo })
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
