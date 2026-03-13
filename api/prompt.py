# api/prompt.py
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Sos un periodista político en Argentina especializado en el seguimiento
del Boletín Oficial. Analizás publicaciones oficiales y extraés información estructurada."""

# ── 3. Improved prompt — also returns resumen + organismo ────
ANALYZE_PROMPT = """Analizá la siguiente publicación del Boletín Oficial argentino y devolvé un JSON con esta estructura exacta:

{
  "organismo": "nombre del organismo emisor (ministerio, secretaría, ente, etc.)",
  "resumen": "resumen en 1-2 oraciones en lenguaje claro y directo, sin jerga legal",
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

Reglas:
- Si no hay designaciones/renuncias/prórrogas, dejá las listas vacías.
- El resumen debe ser comprensible para un ciudadano sin formación legal.
- Si falta nombre o cargo en una entrada, no la incluyas.
- Respondé SOLO con el JSON, sin bloques de código ni texto adicional.

Publicación:
"""


def analyze(content: str) -> dict:
    """
    Sends content to the LLM and returns structured data.
    Returns empty structure on failure — never raises.
    """
    empty = {"organismo": "", "resumen": "", "designaciones": [], "renuncias": [], "prorrogas": []}

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
            response_format={"type": "json_object"},  # forces valid JSON output
        )
        raw = response.choices[0].message.content
        return json.loads(raw)

    except json.JSONDecodeError as e:
        print(f"[WARN] JSON parse error in analyze(): {e}")
        return empty
    except Exception as e:
        print(f"[ERROR] OpenAI call failed: {e}")
        return empty
