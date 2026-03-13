# api/main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import date
from typing import List, Optional
import asyncio

from models import (
    get_db, init_db,
    Resolution, AdministrativeChargesChange, ChargeChangeType,
    Alerta, AlertaNotificacion,
    ResolutionSchema, ResolutionSummarySchema,
    AlertaSchema, AlertaCreateSchema, AlertaPatchSchema, AlertaNotificacionSchema,
)
from scraper import scrape_boletin_oficial

app = FastAPI(title="Botletín API", version="0.3.0")

# ── CORS — allow the Vite dev server ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()


# ════════════════════════════════════════════════════════════
# SCRAPER
# ════════════════════════════════════════════════════════════

def _run_scraper(db: Session):
    asyncio.run(scrape_boletin_oficial(db))

@app.post("/scrape/", tags=["scraper"])
def scrape_website(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_run_scraper, db)
    return {"message": "Scraping task scheduled."}


# ════════════════════════════════════════════════════════════
# STATS
# ════════════════════════════════════════════════════════════

@app.get("/stats", tags=["stats"])
def get_stats(fecha: Optional[date] = None, db: Session = Depends(get_db)):
    target = fecha or date.today()

    total = (
        db.query(func.count(Resolution.id))
        .filter(Resolution.fecha == target)
        .scalar() or 0
    )

    def count_changes(tipo: ChargeChangeType) -> int:
        return (
            db.query(func.count(AdministrativeChargesChange.id))
            .join(Resolution)
            .filter(
                Resolution.fecha == target,
                AdministrativeChargesChange.tipo == tipo,
            )
            .scalar() or 0
        )

    decretos = (
        db.query(func.count(Resolution.id))
        .filter(
            Resolution.fecha == target,
            Resolution.tipo.in_(["Decreto", "Resolución", "Resolución General"]),
        )
        .scalar() or 0
    )

    return {
        "fecha":         str(target),
        "total":         total,
        "designaciones": count_changes(ChargeChangeType.ALTA),
        "bajas":         count_changes(ChargeChangeType.BAJA),
        "prorrogas":     count_changes(ChargeChangeType.PRORROGA),
        "decretos":      decretos,
    }


# ════════════════════════════════════════════════════════════
# RESOLUTIONS
# ════════════════════════════════════════════════════════════

@app.get("/resolutions/", response_model=List[ResolutionSummarySchema], tags=["resolutions"])
def get_resolutions(
    db:        Session        = Depends(get_db),
    skip:      int            = 0,
    limit:     int            = 100,
    fecha:     Optional[date] = None,
    tipo:      Optional[str]  = None,
    organismo: Optional[str]  = None,
    area:      Optional[str]  = None,
    categoria: Optional[str]  = None,
    tema:      Optional[str]  = None,
):
    q = db.query(Resolution)
    if fecha:     q = q.filter(Resolution.fecha     == fecha)
    if tipo:      q = q.filter(Resolution.tipo      == tipo)
    if organismo: q = q.filter(Resolution.organismo == organismo)
    if area:      q = q.filter(Resolution.area      == area)
    if categoria: q = q.filter(Resolution.categoria == categoria)
    if tema:      q = q.filter(Resolution.tema      == tema)
    return q.order_by(Resolution.fecha.desc()).offset(skip).limit(limit).all()


@app.get("/resolutions/search", response_model=List[ResolutionSummarySchema], tags=["resolutions"])
def search_resolutions(
    db:        Session        = Depends(get_db),
    q:         Optional[str]  = Query(None, description="Full-text search across titulo, resumen, organismo"),
    tipo:      Optional[str]  = Query(None),
    area:      Optional[str]  = Query(None),
    organismo: Optional[str]  = Query(None),
    # ── Nuevos filtros ──
    categoria: Optional[str]  = Query(None, description="personal | normativa | licitaciones"),
    tema:      Optional[str]  = Query(None, description="politica | economia | salud | etc."),
    # ── Período ──
    desde:     Optional[date] = Query(None),
    hasta:     Optional[date] = Query(None),
    skip:      int            = 0,
    limit:     int            = 50,
):
    query = db.query(Resolution)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Resolution.titulo.ilike(like),
                Resolution.resumen.ilike(like),
                Resolution.organismo.ilike(like),
                Resolution.area.ilike(like),
            )
        )

    if tipo:      query = query.filter(Resolution.tipo.ilike(f"%{tipo}%"))
    if area:      query = query.filter(Resolution.area.ilike(f"%{area}%"))
    if organismo: query = query.filter(Resolution.organismo.ilike(f"%{organismo}%"))
    if categoria: query = query.filter(Resolution.categoria == categoria)
    if tema:      query = query.filter(Resolution.tema      == tema)
    if desde:     query = query.filter(Resolution.fecha >= desde)
    if hasta:     query = query.filter(Resolution.fecha <= hasta)

    return (
        query
        .order_by(Resolution.score.desc(), Resolution.fecha.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.get("/resolutions/{resolution_id}", response_model=ResolutionSchema, tags=["resolutions"])
def get_resolution(resolution_id: int, db: Session = Depends(get_db)):
    r = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resolution not found")
    return r


# ════════════════════════════════════════════════════════════
# ALERTAS
# ════════════════════════════════════════════════════════════

@app.get("/alertas", response_model=List[AlertaSchema], tags=["alertas"])
def list_alertas(db: Session = Depends(get_db)):
    return db.query(Alerta).all()


@app.post("/alertas", response_model=AlertaSchema, status_code=201, tags=["alertas"])
def create_alerta(payload: AlertaCreateSchema, db: Session = Depends(get_db)):
    alerta = Alerta(**payload.model_dump())
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta


@app.put("/alertas/{alerta_id}", response_model=AlertaSchema, tags=["alertas"])
def update_alerta(alerta_id: int, payload: AlertaCreateSchema, db: Session = Depends(get_db)):
    """
    Reemplaza todos los campos editables de una alerta existente.
    Usa AlertaCreateSchema (mismo payload que POST) para no duplicar modelos.
    El campo `activa` se preserva — para activar/desactivar usar PATCH.
    """
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta not found")

    data = payload.model_dump()
    for field, value in data.items():
        setattr(alerta, field, value)

    db.commit()
    db.refresh(alerta)
    return alerta


@app.patch("/alertas/{alerta_id}", response_model=AlertaSchema, tags=["alertas"])
def patch_alerta(alerta_id: int, payload: AlertaPatchSchema, db: Session = Depends(get_db)):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta not found")
    alerta.activa = int(payload.activa)
    db.commit()
    db.refresh(alerta)
    return alerta


@app.delete("/alertas/{alerta_id}", status_code=204, tags=["alertas"])
def delete_alerta(alerta_id: int, db: Session = Depends(get_db)):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta not found")
    db.delete(alerta)
    db.commit()


@app.get("/alertas/historial", response_model=List[AlertaNotificacionSchema], tags=["alertas"])
def get_historial(
    db:    Session = Depends(get_db),
    limit: int     = 50,
):
    rows = (
        db.query(AlertaNotificacion)
        .order_by(AlertaNotificacion.fecha.desc())
        .limit(limit)
        .all()
    )
    return [
        AlertaNotificacionSchema(
            id=row.id,
            alerta_id=row.alerta_id,
            resolution_id=row.resolution_id,
            fecha=row.fecha,
            leida=bool(row.leida),
            alerta_nombre=row.alerta.nombre if row.alerta else None,
            resolution_titulo=row.resolution.titulo if row.resolution else None,
        )
        for row in rows
    ]


@app.patch("/alertas/historial/{notif_id}/leida", tags=["alertas"])
def mark_leida(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(AlertaNotificacion).filter(AlertaNotificacion.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.leida = 1
    db.commit()
    return {"id": notif_id, "leida": True}


# ════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)