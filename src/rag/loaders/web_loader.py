"""Loader Web — scrape une URL, extrait le contenu principal + chunking."""

from __future__ import annotations

import logging
import re
import tempfile
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

from src.rag.loaders.pdf_loader import parse_pdf
from src.rag.loaders.splitter import split_by_chars

log = logging.getLogger(__name__)

_USER_AGENT = (
    "InfoJuridiqueCitoyenneBot/1.0 "
    "(+https://github.com/Francois-b-24/first ; assistant juridique gabonais)"
)
_REQUEST_TIMEOUT = 10
_REQUEST_HEADERS = {
    "User-Agent": _USER_AGENT,
    "Accept": "text/html,application/pdf;q=0.9,*/*;q=0.8",
}
_STRIP_TAGS = ("script", "style", "nav", "footer", "header", "aside", "form", "noscript")
_MAIN_SELECTORS = ("main", "article", "[role=main]", "#content", ".content")
_MULTINEWLINE_RE = re.compile(r"\n{3,}")
_MULTISPACE_RE = re.compile(r"[ \t]+")
_PDF_PATH_RE = re.compile(r"\.pdf(?:$|[?#])", re.IGNORECASE)


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


def _normalize_url(base_url: str, href: str) -> str:
    absolute = urljoin(base_url, href)
    cleaned, _ = urldefrag(absolute)
    return cleaned


def _is_same_host(url: str, root_host: str) -> bool:
    return urlparse(url).netloc == root_host


def _is_pdf_url(url: str) -> bool:
    return bool(_PDF_PATH_RE.search(urlparse(url).path) or _PDF_PATH_RE.search(url))


def _is_http_url(url: str) -> bool:
    return url.startswith("http://") or url.startswith("https://")


def _is_html_content(resp: requests.Response) -> bool:
    ctype = (resp.headers.get("Content-Type") or "").lower()
    return "text/html" in ctype


def _is_pdf_response(resp: requests.Response) -> bool:
    ctype = (resp.headers.get("Content-Type") or "").lower()
    if "application/pdf" in ctype:
        return True
    # Fallback: certains serveurs exposent un mauvais content-type.
    return resp.content.startswith(b"%PDF")


def _allowed_by_robots(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = RobotFileParser()
    try:
        parser.set_url(robots_url)
        parser.read()
    except Exception:  # noqa: BLE001
        # Comportement permissif si robots inaccessible, mais tracé.
        log.info("robots.txt inaccessible pour %s", parsed.netloc)
        return True
    return parser.can_fetch(_USER_AGENT, url)


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
            headers=_REQUEST_HEADERS,
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


def discover_pdf_links(
    start_url: str,
    *,
    max_pages: int = 25,
    max_pdfs: int = 40,
    max_depth: int = 2,
) -> list[str]:
    """Parcourt un site et retourne les liens PDF détectés.

    - Limité au même host que ``start_url``.
    - Respecte robots.txt.
    - Ignore les URLs externes.
    """
    root_host = urlparse(start_url).netloc
    if not root_host:
        return []

    queue: deque[tuple[str, int]] = deque([(start_url, 0)])
    seen_pages: set[str] = set()
    seen_pdfs: set[str] = set()
    found_pdfs: list[str] = []

    while queue and len(seen_pages) < max_pages and len(found_pdfs) < max_pdfs:
        page_url, depth = queue.popleft()
        if page_url in seen_pages:
            continue
        if not _is_same_host(page_url, root_host):
            continue
        if not _allowed_by_robots(page_url):
            log.info("robots.txt bloque %s", page_url)
            continue

        seen_pages.add(page_url)
        try:
            resp = requests.get(
                page_url,
                timeout=_REQUEST_TIMEOUT,
                headers=_REQUEST_HEADERS,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            log.warning("Échec crawl %s : %s", page_url, exc)
            continue

        if not _is_html_content(resp):
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        for anchor in soup.select("a[href]"):
            href = anchor.get("href") or ""
            if not href.strip():
                continue
            target = _normalize_url(page_url, href)
            if not _is_http_url(target):
                continue

            if _is_pdf_url(target):
                if target not in seen_pdfs and _allowed_by_robots(target):
                    seen_pdfs.add(target)
                    found_pdfs.append(target)
                    if len(found_pdfs) >= max_pdfs:
                        break
                continue

            if depth < max_depth and _is_same_host(target, root_host):
                queue.append((target, depth + 1))

    return found_pdfs


def parse_pdf_url(url: str) -> list[dict]:
    """Télécharge un PDF distant puis le découpe via le parser PDF local."""
    if not _allowed_by_robots(url):
        log.info("robots.txt bloque le PDF %s", url)
        return []

    try:
        resp = requests.get(
            url,
            timeout=_REQUEST_TIMEOUT,
            headers={**_REQUEST_HEADERS, "Referer": url},
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.warning("Échec téléchargement PDF %s : %s", url, exc)
        return []

    if not _is_pdf_response(resp):
        log.warning(
            "Réponse non-PDF pour %s (content-type=%s)",
            url,
            resp.headers.get("Content-Type"),
        )
        return []

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(resp.content)
        tmp_path = Path(tmp.name)

    try:
        chunks = parse_pdf(tmp_path)
        for chunk in chunks:
            chunk["url"] = url
        return chunks
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:  # noqa: BLE001
            pass
