# api/prompt.py
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Sos un editor periodístico especializado en el seguimiento del Boletín Oficial
de la República Argentina. Tu tarea es analizar publicaciones oficiales, extraer información
estructurada y evaluarlas con criterio editorial."""

ANALYZE_PROMPT = """Analizá la siguiente publicación del Boletín Oficial argentino y devolvé un JSON con esta estructura exacta:

{
  "organismo": "nombre del organismo emisor (ministerio, secretaría, ente, etc.)",
  "resumen": "resumen en 1-2 oraciones en lenguaje claro y directo, sin jerga legal",
  "categoria": "una de: personal | normativa | licitaciones",
  "tema": "uno de: politica | justicia | economia | infraestructura | salud | educacion | medioambiente | sociedad | exterior | defensa",
  "score": <número entero entre 0 y 100>,
  "designaciones": [
    { "nombre": "...", "cargo": "...", "dni": "..." }
  ],
  "renuncias": [
    { "nombre": "...", "cargo": "...", "dni": "..." }
  ],
  "prorrogas": [
    { "nombre": "...", "cargo": "...", "dni": "..." }
  ]
}

── CATEGORÍAS ──────────────────────────────────────────────────────────────────
- "personal": la publicación designa, acepta renuncias o prorroga cargos de personas
- "normativa": establece, modifica o deroga reglas, regulaciones o políticas públicas
- "licitaciones": llama a licitación, concurso, adjudica contratos o aprueba contrataciones

── TEMAS ───────────────────────────────────────────────────────────────────────
Asigná el tema según el área de política pública involucrada:
- "politica": decisiones del ejecutivo, estructura del estado, decretos presidenciales, DNUs
- "justicia": poder judicial, ministerio de justicia, fuerzas de seguridad, penitenciaría
- "economia": hacienda, AFIP, comercio, aranceles, finanzas, presupuesto, impuestos
- "infraestructura": obras públicas, vialidad, transporte, energía, minería, telecomunicaciones
- "salud": ministerio de salud, PAMI, ANMAT, regulación sanitaria, medicamentos
- "educacion": ministerio de educación, universidades, becas, ciencia y tecnología
- "medioambiente": recursos naturales, agro, pesca, medio ambiente, agua
- "sociedad": desarrollo social, género, cultura, deporte, turismo, trabajo
- "exterior": cancillería, relaciones internacionales, comercio exterior, migraciones
- "defensa": fuerzas armadas, seguridad nacional, gendarmería, prefectura

── SCORE (0-100) ───────────────────────────────────────────────────────────────
El score refleja la relevancia periodística de la publicación. Calculalo según la categoría:

Para "personal":
- Base 50 si es Secretario/a o superior → +20 si es Subsecretario/a → +30 si es Secretario/a de Estado o superior
- +20 si es designación o renuncia (más noticiosa que prórroga)
- +10 si el organismo es de alto impacto público (AFIP, ANSES, PAMI, Banco Central, etc.)
- -20 si es un cargo técnico de bajo rango (coordinador, analista, etc.)

Para "normativa":
- Base 40
- +30 si es DNU (Decreto de Necesidad y Urgencia)
- +20 si es Decreto presidencial
- +20 si afecta derechos de ciudadanos o tiene impacto masivo
- +10 si establece nueva política pública relevante
- -10 si es una prórroga o modificación menor

Para "licitaciones":
- Base 30
- +30 si el monto supera los $1.000 millones o USD 1 millón
- +20 si involucra infraestructura estratégica (rutas, hospitales, energía)
- +10 si la adjudicación ya tiene empresa ganadora (más noticiosa)
- -10 si es contratación menor o rutinaria

── REGLAS GENERALES ────────────────────────────────────────────────────────────
- Si no hay designaciones/renuncias/prórrogas, dejá las listas vacías.
- El resumen debe ser comprensible para un ciudadano sin formación legal.
- Si falta nombre o cargo en una entrada de personal, no la incluyas.
- Respondé SOLO con el JSON, sin bloques de código ni texto adicional.

Publicación:
"""


def analyze(content: str) -> dict:
    """
    Sends content to the LLM and returns structured data.
    Returns empty structure on failure — never raises.
    """
    empty = {
        "organismo": "",
        "resumen": "",
        "categoria": "normativa",
        "tema": "politica",
        "score": 0,
        "designaciones": [],
        "renuncias": [],
        "prorrogas": [],
    }

    if not content or not content.strip():
        return empty

    # Truncate to avoid token limits (~12k chars ≈ 3k tokens, well within gpt-4o-mini)
    truncated = content[:12_000]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": ANALYZE_PROMPT + truncated},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        return json.loads(raw)

    except json.JSONDecodeError as e:
        print(f"[WARN] JSON parse error in analyze(): {e}")
        return empty
    except Exception as e:
        print(f"[ERROR] OpenAI call failed: {e}")
        return empty