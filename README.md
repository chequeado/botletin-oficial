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
           │                   
           ▼                  
┌──────────────────┐   
│  FastAPI         │   
│  api/main.py     │   
│                  │   
│  GET /stats      │  
│  GET /resolutions│   
│  GET /alertas    │   
│  POST /scrape    │   
└────────┬─────────┘   
         │
         ▼
┌──────────────────────────────┐
│  Frontend React + Vite       │
│  Feed / Búsqueda / Alertas   │
└──────────────────────────────┘
```

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