# Botletín — Frontend

React + Vite app. Corre en paralelo con la API de FastAPI.

## Arrancar en desarrollo

```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

La API de FastAPI debe estar corriendo en `http://localhost:8000`.
El proxy en `vite.config.js` redirige `/api/*` → `http://localhost:8000/*`.

## Conectar datos reales

En `src/api.js`, cambiar:

```js
const USE_MOCK = false   // ← de true a false
```

Eso es todo. Todos los componentes ya usan las funciones de `api.js`.

## Endpoints esperados en FastAPI

| Función frontend      | Método | URL                        |
|-----------------------|--------|----------------------------|
| `getStats()`          | GET    | `/stats`                   |
| `getFeed(fecha?)`     | GET    | `/resolutions/?fecha=...`  |
| `searchResolutions()` | GET    | `/resolutions/search?q=...`|
| `getAlertas()`        | GET    | `/alertas`                 |
| `getHistorial()`      | GET    | `/alertas/historial`       |
| `toggleAlerta(id)`    | PATCH  | `/alertas/:id`             |

## Build para producción

```bash
npm run build      # genera /frontend/dist/
```

En Vercel: apuntar el root directory a `frontend/`.
En GitHub Pages: ver `.github/workflows/deploy-frontend.yml`.

## Estructura

```
src/
├── api.js              ← toda la lógica de datos (mock ↔ real)
├── styles.css          ← design tokens + componentes CSS
├── App.jsx             ← nav + routing entre páginas
├── main.jsx            ← entry point
└── components/
    ├── Feed.jsx        ← pantalla principal
    ├── Busqueda.jsx    ← búsqueda + filtros
    ├── Alertas.jsx     ← panel de suscripciones
    └── Modal.jsx       ← detalle de una publicación
```
