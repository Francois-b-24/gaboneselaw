"""Synthèse de documents juridiques et génération de rapports structurés."""

from __future__ import annotations

import io
from typing import TYPE_CHECKING

from src.agent.prompts import (
    REPORT_PROMPT,
    SYNTHESIS_PROMPT,
    format_context,
)

if TYPE_CHECKING:
    from src.agent.llm import AnthropicLLM
    from src.rag.retriever import LegalChunk


def _collect_stream(llm: "AnthropicLLM", messages: list[dict]) -> str:
    return "".join(llm.stream(messages, temperature=0.2, max_tokens=2048))


def synthese_document(
    chunks: list["LegalChunk"],
    focus: str | None,
    llm: "AnthropicLLM",
) -> str:
    """Produit une synthèse en bullets des extraits fournis.

    Reste fidèle au texte des extraits, préserve les citations d'articles.
    """
    if not chunks:
        return (
            "Je ne dispose pas d'extraits à synthétiser. Essayez une recherche "
            "juridique plus précise au préalable."
        )

    context_block = format_context(chunks)
    user_parts = [
        "Voici les extraits juridiques à synthétiser :",
        "",
        context_block,
    ]
    if focus:
        user_parts.extend(["", f"Angle particulier demandé : {focus}"])

    messages = [
        {"role": "system", "content": SYNTHESIS_PROMPT},
        {"role": "user", "content": "\n".join(user_parts)},
    ]
    return _collect_stream(llm, messages)


def generer_rapport(
    sujet: str,
    chunks: list["LegalChunk"],
    llm: "AnthropicLLM",
) -> str:
    """Génère un rapport structuré en markdown sur ``sujet``."""
    if not chunks:
        return (
            f"# Rapport : {sujet}\n\n"
            "Aucun extrait juridique disponible pour construire un rapport. "
            "Essayez une recherche plus précise."
        )

    context_block = format_context(chunks)
    user_content = (
        f"Sujet du rapport : **{sujet}**\n\n"
        f"Extraits juridiques disponibles :\n\n{context_block}"
    )
    messages = [
        {"role": "system", "content": REPORT_PROMPT},
        {"role": "user", "content": user_content},
    ]
    return _collect_stream(llm, messages)


def markdown_to_pdf(md_text: str, title: str = "Rapport juridique") -> bytes:
    """Convertit un texte markdown (simple) en PDF via reportlab.

    Rendu minimaliste : titres ``#``/``##`` distingués, paragraphes séparés
    par des lignes vides, bullets ``-``/``*`` en liste puce. Pas d'emphase,
    pas de tableaux — suffisant pour les rapports produits par ``generer_rapport``.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer

    styles = getSampleStyleSheet()
    h1 = styles["Heading1"]
    h2 = styles["Heading2"]
    body = styles["BodyText"]

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        title=title,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    story = []
    pending_bullets: list[str] = []

    def flush_bullets():
        if pending_bullets:
            items = [ListItem(Paragraph(b, body)) for b in pending_bullets]
            story.append(ListFlowable(items, bulletType="bullet"))
            story.append(Spacer(1, 6))
            pending_bullets.clear()

    for raw_line in md_text.splitlines():
        line = raw_line.rstrip()
        if not line:
            flush_bullets()
            story.append(Spacer(1, 6))
            continue
        if line.startswith("# "):
            flush_bullets()
            story.append(Paragraph(line[2:], h1))
        elif line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(line[3:], h2))
        elif line.startswith(("- ", "* ")):
            pending_bullets.append(line[2:])
        else:
            flush_bullets()
            story.append(Paragraph(line, body))

    flush_bullets()
    doc.build(story)
    return buf.getvalue()
