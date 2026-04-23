"""Loader Web — scrape une URL, extrait le contenu principal + chunking."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

from src.rag.loaders.splitter import split_by_chars

log = logging.getLogger(__name__)

_USER_AGENT = (
    "InfoJuridiqueCitoyenneBot/1.0 "
    "(+https://github.com/Francois-b-24/first ; assistant juridique gabonais)"
)
_REQUEST_TIMEOUT = 10
_STRIP_TAGS = ("script", "style", "nav", "footer", "header", "aside", "form", "noscript")
_MAIN_SELECTORS = ("main", "article", "[role=main]", "#content", ".content")
_MULTINEWLINE_RE = re.compile(r"\n{3,}")
_MULTISPACE_RE = re.compile(r"[ \t]+")


def _extract_main_text(soup: BeautifulSoup) -> str:
    """Cherche un conteneur principal, fallback sur body. Nettoie les espaces."""
    for tag in soup(_STRIP_TAGS):
        tag.decompose()

    container = None
    for sel in _MAIN_SELECTORS:
        container = soup.select_one(sel)
        if container:
            break
    if container is None:
        container = soup.body or soup

    text = container.get_text(separator="\n")
    text = _MULTISPACE_RE.sub(" ", text)
    text = _MULTINEWLINE_RE.sub("\n\n", text)
    return text.strip()


def _extract_title(soup: BeautifulSoup) -> str:
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(strip=True)
    return ""


def parse_web(url: str) -> list[dict]:
    """Récupère une page web et la découpe en chunks.

    Retourne une liste vide en cas d'erreur réseau ou de page vide — ne jamais
    faire planter l'ingestion globale pour une URL défaillante.

    Chaque chunk porte ``{text, url, title, scraped_at, source_type}``.
    """
    try:
        resp = requests.get(
            url,
            timeout=_REQUEST_TIMEOUT,
            headers={"User-Agent": _USER_AGENT},
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.warning("Échec scraping %s : %s", url, exc)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    text = _extract_main_text(soup)
    if not text:
        log.warning("Page vide après nettoyage : %s", url)
        return []

    title = _extract_title(soup)
    scraped_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    chunks: list[dict] = []
    for sub in split_by_chars(text):
        chunks.append({
            "text": sub,
            "url": url,
            "title": title,
            "scraped_at": scraped_at,
            "source_type": "web",
        })
    return chunks
