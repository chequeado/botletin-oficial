# 🤖 Botletín Oficial

Sistema de scraping, análisis con IA y distribución de publicaciones del Boletín Oficial de la República Argentina. Extrae, clasifica y envía por email las resoluciones diarias con resúmenes en lenguaje claro.

---

## Arquitectura

El sistema tiene tres componentes principales que se orquestan con Docker Compose: un scraper ETL que corre de manera programada, una API REST que expone los datos, y un frontend React que los visualiza.

```
┌──────────────────────────────┐
│  boletinoficial.gob.ar       │
│  /seccion/primera            │
└──────────────┬───────────────┘
               │ HTTP scraping (httpx + BeautifulSoup)
               ▼
┌──────────────────────────────┐
│  ETL — api/scraper.py        │  (este repositorio)
│                              │
│  1. Obtiene URLs del día      │
│  2. Extrae texto de cada pub. │
│  3. Llama a OpenAI (análisis) │
│  4. Persiste en SQLite        │
└──────────────┬───────────────┘
               │ SQLAlchemy ORM
               ▼
┌──────────────────────────────┐
│  SQLite — /app/data/         │
│  boletinoficial.db           │
└──────────┬───────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐   ┌──────────────────────┐
│  FastAPI         │   │  Publisher           │
│  api/main.py     │   │  publisher/main.py   │
│                  │   │                      │
│  GET /stats      │   │  Lee JSON del día    │
│  GET /resolutions│   │  Rankea por score    │
│  GET /alertas    │   │  Renderiza template  │
│  POST /scrape    │   │  Envía email         │
└────────┬─────────┘   └──────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Frontend React + Vite       │
│  Feed / Búsqueda / Alertas   │
└──────────────────────────────┘
```

---

## Dependencias externas

**APIs y servicios de terceros:**

| Servicio | Uso |
|----------|-----|
| OpenAI API (`gpt-4o-mini`) | Análisis de publicaciones: extrae organismo, resumen, designaciones, renuncias y prórrogas |
| Mailchimp Transactional (ex-Mandrill) | Envío de emails diarios con el digest del boletín |
| boletinoficial.gob.ar | Fuente de datos — scraping de la sección Primera |

---

## Configuración

```bash
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key de OpenAI para el análisis de publicaciones | `sk-proj-abc123...` |
| `MAILCHIMP_API_KEY` | API key de Mailchimp Transactional para el envío de emails | `abc123def456...` |
| `DATABASE_URL` | ⚠️ Opcional. Override del path de SQLite. Por defecto usa el volumen Docker | `sqlite:////app/data/boletinoficial.db` |

⚠️ No usar comentarios inline en el `.env` (en la misma línea que el valor). `python-dotenv` los incluye como parte del valor y rompe la autenticación silenciosamente. Ejemplo incorrecto: `OPENAI_API_KEY=sk-abc # mi clave`.

---

## Instalación y deploy

### Requisitos

- Docker Engine 24+
- Docker Compose v2
- Credenciales de OpenAI y Mailchimp (ver sección Configuración)

### Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/chequeado/botletin-oficial
cd botletin-oficial

# 2. Configurar entorno
cp .env.example .env
# Editar .env con las API keys reales

# 3. Levantar API + frontend
docker compose up --build

# API disponible en:  http://localhost:8000
# Frontend en:        http://localhost:80
# Docs interactivos:  http://localhost:8000/docs
```

Para activar el scheduler interno (alternativa al GitHub Action):

```bash
docker compose --profile scheduler up --build
```

### Producción

Los contenedores `api` y `frontend` tienen `restart: unless-stopped` — se levantan automáticamente ante reinicios del servidor.

El scraper corre de dos formas posibles (elegir una):
- **GitHub Actions** (`.github/workflows/update-boletin-am.yml`): lunes a viernes a las 04:15 UTC
- **Scheduler Docker** (profile `scheduler`): mismo horario, corre dentro del stack

---

## Uso

### Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/stats` | Conteos del día: total, designaciones, bajas, prórrogas, decretos |
| `GET` | `/resolutions/` | Lista de publicaciones con filtros opcionales (`fecha`, `tipo`, `organismo`, `area`) |
| `GET` | `/resolutions/search` | Búsqueda full-text + filtros combinados |
| `GET` | `/resolutions/{id}` | Detalle completo de una publicación |
| `POST` | `/scrape/` | Dispara el scraping del día en background |
| `GET` | `/alertas` | Lista de alertas configuradas |
| `POST` | `/alertas` | Crea una nueva alerta |
| `PATCH` | `/alertas/{id}` | Activa o desactiva una alerta |
| `DELETE` | `/alertas/{id}` | Elimina una alerta |
| `GET` | `/alertas/historial` | Historial de notificaciones disparadas |

```bash
# Disparar scraping manualmente
curl -X POST http://localhost:8000/scrape/

# Ver publicaciones de hoy
curl "http://localhost:8000/resolutions/?fecha=$(date +%Y-%m-%d)"

# Buscar por texto
curl "http://localhost:8000/resolutions/search?q=ministerio+economia"
```

### Frontend

El frontend tiene un modo mock activado por defecto (`USE_MOCK = true` en `frontend/api.js`). Para conectar con la API real:

```js
// frontend/api.js
const USE_MOCK = false  // cambiar de true a false
```

---

## Logs y monitoreo

```bash
# Ver logs en tiempo real
docker compose logs -f api
docker compose logs -f frontend

# Verificar que la API está viva
curl http://localhost:8000/stats

# Ver el estado de los contenedores y healthcheck
docker compose ps
```

### Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| `dependency failed to start: container botletin-api is unhealthy` | La imagen `python:3.11-slim` no incluye `curl`. El healthcheck debe usar `python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/stats')"` — ver `docker-compose.yml` |
| El scraping no genera datos | Verificar que `OPENAI_API_KEY` esté seteada y sin espacios ni comentarios inline. Revisar `docker compose logs api` |
| Emails no se envían | Verificar `MAILCHIMP_API_KEY`. El from_email `innovacion@chequeado.com` debe estar verificado en Mailchimp Transactional |
| Frontend muestra datos de ejemplo en producción | `USE_MOCK` está en `true` en `frontend/api.js`. Cambiar a `false` y rebuildar |
| `Resolution not found` en `/resolutions/{id}` | La base de datos está vacía. Disparar un scraping con `POST /scrape/` o esperar al cron del día siguiente |
| Variables de entorno no se leen | Comentarios inline en `.env` rompen python-dotenv. Mover comentarios a líneas separadas |

---