# api/scraper.py
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy.orm import Session
from models import Resolution, AdministrativeChargesChange, ChargeChangeType
import prompt
from typing import Dict, Any


async def today_urls():
    """Returns a list of URLs for today's publications."""
    base_url = "https://www.boletinoficial.gob.ar"
    articles_url = base_url + "/seccion/primera"

    async with httpx.AsyncClient() as client:
        response = await client.get(articles_url, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")
    body = soup.find(id="avisosSeccionDiv")
    if not body:
        return [], response.status_code

    all_urls = [
        base_url + a["href"]
        for a in body.find_all("a", href=True)
    ]
    urls = [u for u in all_urls if "?" not in u]
    return urls, response.status_code


async def scrape_article(article_url: str, db: Session) -> Resolution | None:
    """Scrapes a single article. Returns None on failure."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(article_url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        print(f"  [ERROR] Could not fetch {article_url}: {e}")
        return None

    soup = BeautifulSoup(response.content, "html.parser")

    title_el = soup.find(id="tituloDetalleAviso")
    title    = title_el.find("h2").text.strip() if title_el and title_el.find("h2") else ""
    area     = title_el.find("h1").text.strip() if title_el and title_el.find("h1") else ""

    type_el  = soup.find(class_="puntero first-section")
    tipo     = type_el.text.strip() if type_el else ""

    content_el = soup.find(id="cuerpoDetalleAviso")
    content    = content_el.text.strip() if content_el else ""

    resolution = Resolution(
        fecha=datetime.today(),
        titulo=title,
        url=article_url,
        tipo=tipo,
        organismo="",      # populated by prompt below
        area=area,
        texto_completo=content,
        resumen="",        # populated by prompt below
        archivos=[],
    )

    try:
        analysis_result = prompt.analyze(content)
        resolution.resumen   = analysis_result.get("resumen", "")
        resolution.organismo = analysis_result.get("organismo", area)
        process_analysis_result(resolution, analysis_result)
    except Exception as e:
        print(f"  [WARN] Prompt failed for {article_url}: {e}")

    db.add(resolution)
    return resolution


def process_analysis_result(resolution: Resolution, analysis_result: Dict[str, Any]):
    for item in analysis_result.get("designaciones", []):
        _create_change(resolution, item, ChargeChangeType.ALTA)
    for item in analysis_result.get("renuncias", []):
        _create_change(resolution, item, ChargeChangeType.BAJA)
    for item in analysis_result.get("prorrogas", []):
        _create_change(resolution, item, ChargeChangeType.PRORROGA)


def _create_change(resolution: Resolution, data: Dict[str, Any], change_type: ChargeChangeType):
    # BUG FIX: was `null` (JS) instead of `None` (Python)
    admin_change = AdministrativeChargesChange(
        tipo=change_type,
        nombre=data.get("nombre", ""),
        cargo=data.get("cargo", ""),
        dni=data.get("dni"),          # None if missing — correct Python null
        replaces=data.get("replaces"),
    )
    resolution.administrative_changes.append(admin_change)


async def scrape_boletin_oficial(db: Session):
    urls, _ = await today_urls()
    print(f"{len(urls)} publications found.")

    for i, url in enumerate(urls):
        print(f"  [{i+1}/{len(urls)}] {url}")
        resolution = await scrape_article(url, db)
        if resolution:
            print(f"    ✓ {resolution.titulo[:60]}  ({len(resolution.administrative_changes)} changes)")

    db.commit()
    print("Scraping complete.")
