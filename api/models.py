# api/models.py
import enum
import os
from sqlalchemy import create_engine, Column, Integer, String, Date, JSON, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from typing import Generator, List, Optional
from pydantic import BaseModel
from datetime import date

# ── Database setup ────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/boletinoficial.db")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Enums ─────────────────────────────────────────────────────
class ChargeChangeType(enum.Enum):
    ALTA     = "Alta"
    BAJA     = "Baja"
    PRORROGA = "Prorroga"

class CategoriaType(enum.Enum):
    PERSONAL     = "personal"
    NORMATIVA    = "normativa"
    LICITACIONES = "licitaciones"

class TemaType(enum.Enum):
    POLITICA       = "politica"
    JUSTICIA       = "justicia"
    ECONOMIA       = "economia"
    INFRAESTRUCTURA= "infraestructura"
    SALUD          = "salud"
    EDUCACION      = "educacion"
    MEDIOAMBIENTE  = "medioambiente"
    SOCIEDAD       = "sociedad"
    EXTERIOR       = "exterior"
    DEFENSA        = "defensa"


# ── ORM Models ────────────────────────────────────────────────
class Resolution(Base):
    __tablename__ = "resolutions"

    id             = Column(Integer,  primary_key=True, index=True)
    fecha          = Column(Date,     index=True)
    titulo         = Column(String,   index=True)
    url            = Column(String)
    tipo           = Column(String,   index=True)
    organismo      = Column(String,   index=True)
    area           = Column(String,   index=True)
    texto_completo = Column(Text)
    resumen        = Column(Text,     default="")
    score          = Column(Integer,  default=0)
    categoria      = Column(String,   default="normativa", index=True)  # NEW
    tema           = Column(String,   default="politica",  index=True)  # NEW
    archivos       = Column(JSON,     default=list)

    administrative_changes = relationship(
        "AdministrativeChargesChange",
        back_populates="resolution",
        cascade="all, delete-orphan",
    )


class AdministrativeChargesChange(Base):
    __tablename__ = "administrative_charges_changes"

    id            = Column(Integer,                primary_key=True, index=True)
    resolution_id = Column(Integer,                ForeignKey("resolutions.id"))
    tipo          = Column(Enum(ChargeChangeType))
    nombre        = Column(String)
    cargo         = Column(String)
    dni           = Column(String,  nullable=True)
    replaces      = Column(String,  nullable=True)

    resolution = relationship("Resolution", back_populates="administrative_changes")


# ── Alerta models ─────────────────────────────────────────────
class CanalType(enum.Enum):
    EMAIL    = "email"
    TELEGRAM = "telegram"

class FrecuenciaType(enum.Enum):
    INMEDIATO = "inmediato"
    DIARIO    = "diario"
    SEMANAL   = "semanal"

class Alerta(Base):
    __tablename__ = "alertas"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String)
    descripcion = Column(Text,    default="")
    keywords    = Column(JSON,    default=list)
    tipos       = Column(JSON,    default=list)
    organismos  = Column(JSON,    default=list)
    canal       = Column(Enum(CanalType),       default=CanalType.EMAIL)
    frecuencia  = Column(Enum(FrecuenciaType),  default=FrecuenciaType.DIARIO)
    activa      = Column(Integer, default=1)

    historial = relationship(
        "AlertaNotificacion",
        back_populates="alerta",
        cascade="all, delete-orphan",
    )


class AlertaNotificacion(Base):
    __tablename__ = "alerta_notificaciones"

    id            = Column(Integer, primary_key=True, index=True)
    alerta_id     = Column(Integer, ForeignKey("alertas.id"))
    resolution_id = Column(Integer, ForeignKey("resolutions.id"))
    fecha         = Column(Date,    index=True)
    leida         = Column(Integer, default=0)

    alerta     = relationship("Alerta",     back_populates="historial")
    resolution = relationship("Resolution")


# ── DB helpers ────────────────────────────────────────────────
def init_db() -> None:
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic schemas ──────────────────────────────────────────
class AdministrativeChargesChangeSchema(BaseModel):
    tipo:     ChargeChangeType
    nombre:   str
    cargo:    str
    dni:      Optional[str] = None
    replaces: Optional[str] = None

    model_config = {"from_attributes": True}


class ResolutionSchema(BaseModel):
    id:             int
    fecha:          date
    titulo:         str
    url:            str
    tipo:           str
    organismo:      str
    area:           str
    resumen:        str = ""
    score:          int = 0
    categoria:      str = "normativa"
    tema:           str = "politica"
    archivos:       Optional[List[str]] = []
    administrative_changes: List[AdministrativeChargesChangeSchema] = []

    model_config = {"from_attributes": True}


class ResolutionSummarySchema(BaseModel):
    id:        int
    fecha:     date
    titulo:    str
    url:       str
    tipo:      str
    organismo: str
    area:      str
    resumen:   str = ""
    score:     int = 0
    categoria: str = "normativa"
    tema:      str = "politica"

    model_config = {"from_attributes": True}


class AlertaSchema(BaseModel):
    id:          int
    nombre:      str
    descripcion: str = ""
    keywords:    List[str] = []
    tipos:       List[str] = []
    organismos:  List[str] = []
    canal:       CanalType
    frecuencia:  FrecuenciaType
    activa:      bool

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "__dict__") and "activa" in obj.__dict__:
            obj.activa = bool(obj.activa)
        return super().model_validate(obj, *args, **kwargs)


class AlertaCreateSchema(BaseModel):
    nombre:      str
    descripcion: str = ""
    keywords:    List[str] = []
    tipos:       List[str] = []
    organismos:  List[str] = []
    canal:       CanalType       = CanalType.EMAIL
    frecuencia:  FrecuenciaType  = FrecuenciaType.DIARIO


class AlertaPatchSchema(BaseModel):
    activa: bool


class AlertaNotificacionSchema(BaseModel):
    id:            int
    alerta_id:     int
    resolution_id: int
    fecha:         date
    leida:         bool
    alerta_nombre: Optional[str] = None
    resolution_titulo: Optional[str] = None

    model_config = {"from_attributes": True}