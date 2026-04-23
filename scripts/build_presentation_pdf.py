"""Génère docs/presentation-info-juridique-citoyenne.pdf.

Document de présentation destiné à être partagé dans Notion — décrit ce qui a
été réalisé et les fonctionnalités actuelles de l'agent Info Juridique
Citoyenne. Rendu institutionnel sobre (palette bleu marine / crème).
"""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent.parent / "docs" / "presentation-info-juridique-citoyenne.pdf"

NAVY = colors.HexColor("#1a2332")
INK = colors.HexColor("#2c4a6e")
MUTED = colors.HexColor("#475569")
CREAM = colors.HexColor("#fbfaf5")
BORDER = colors.HexColor("#d6dfeb")


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    body = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=NAVY,
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    return {
        "badge": ParagraphStyle(
            "Badge", parent=body, fontName="Helvetica-Bold", fontSize=8,
            textColor=INK, spaceAfter=4, leading=10,
        ),
        "title": ParagraphStyle(
            "Title", parent=body, fontName="Helvetica-Bold", fontSize=24,
            leading=28, textColor=NAVY, spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", parent=body, fontName="Helvetica", fontSize=12,
            leading=17, textColor=MUTED, spaceAfter=20,
        ),
        "h1": ParagraphStyle(
            "H1", parent=body, fontName="Helvetica-Bold", fontSize=15,
            leading=20, textColor=NAVY, spaceBefore=14, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "H2", parent=body, fontName="Helvetica-Bold", fontSize=12,
            leading=16, textColor=INK, spaceBefore=10, spaceAfter=5,
        ),
        "body": body,
        "caption": ParagraphStyle(
            "Caption", parent=body, fontName="Helvetica-Oblique", fontSize=9,
            textColor=MUTED, spaceAfter=4,
        ),
        "footer": ParagraphStyle(
            "Footer", parent=body, fontName="Helvetica", fontSize=8,
            textColor=MUTED,
        ),
    }


def _inline_md(text: str) -> str:
    """**bold** → <b>, `code` → <font name=Courier>."""
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font name="Courier" size="9.5">\1</font>', text)
    return text


def _md_to_flowables(md: str, styles: dict[str, ParagraphStyle]) -> list:
    flow: list = []
    pending: list[str] = []

    def flush():
        if pending:
            items = [ListItem(Paragraph(_inline_md(b), styles["body"]), leftIndent=10) for b in pending]
            flow.append(ListFlowable(items, bulletType="bullet", leftIndent=14, bulletFontSize=9))
            flow.append(Spacer(1, 4))
            pending.clear()

    for raw in md.splitlines():
        line = raw.rstrip()
        if not line:
            flush()
            flow.append(Spacer(1, 4))
            continue
        if line.startswith("## "):
            flush()
            flow.append(Paragraph(_inline_md(line[3:]), styles["h2"]))
        elif line.startswith("# "):
            flush()
            flow.append(Paragraph(_inline_md(line[2:]), styles["h1"]))
        elif line.startswith(("- ", "* ")):
            pending.append(line[2:])
        else:
            flush()
            flow.append(Paragraph(_inline_md(line), styles["body"]))
    flush()
    return flow


def _tools_table(styles: dict[str, ParagraphStyle]) -> Table:
    header_style = ParagraphStyle(
        "TH", parent=styles["body"], fontName="Helvetica-Bold", fontSize=9.5,
        textColor=colors.white, leading=12,
    )
    cell = ParagraphStyle(
        "TD", parent=styles["body"], fontName="Helvetica", fontSize=9.5, leading=13,
    )
    code = ParagraphStyle(
        "TDCode", parent=cell, fontName="Courier-Bold", textColor=INK,
    )
    data = [
        [Paragraph("Outil", header_style), Paragraph("Rôle", header_style)],
        [Paragraph("recherche_juridique", code),
         Paragraph("Recherche sémantique dans le corpus (articles pertinents).", cell)],
        [Paragraph("lire_article", code),
         Paragraph("Lecture du texte complet d'un article par son numéro.", cell)],
        [Paragraph("calculer_indemnite", code),
         Paragraph("Calcul d'indemnité de licenciement et préavis (Art. 72 &amp; 75 du Code du travail).", cell)],
        [Paragraph("synthese_document", code),
         Paragraph("Synthèse structurée des règles juridiques sur un sujet donné.", cell)],
        [Paragraph("generer_rapport", code),
         Paragraph("Rapport complet : contexte, cadre, points clés, démarches.", cell)],
    ]
    tbl = Table(data, colWidths=[55 * mm, 110 * mm], hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER),
        ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def _stack_table(styles: dict[str, ParagraphStyle]) -> Table:
    cell = ParagraphStyle("TDs", parent=styles["body"], fontName="Helvetica", fontSize=9.5, leading=13)
    bold = ParagraphStyle("TDb", parent=cell, fontName="Helvetica-Bold", textColor=INK)
    rows = [
        [Paragraph("Interface", bold), Paragraph("Streamlit (chat, streaming, sidebar upload, responsive mobile)", cell)],
        [Paragraph("LLM", bold), Paragraph("Groq · llama-3.3-70b-versatile (fallback llama-3.1-8b-instant)", cell)],
        [Paragraph("Embeddings", bold), Paragraph("intfloat/multilingual-e5-base via sentence-transformers", cell)],
        [Paragraph("Vector store", bold), Paragraph("ChromaDB persistant — collections droit_gabonais + droit_gabonais_uploads", cell)],
        [Paragraph("Corpus", bold), Paragraph("PDFs officiels (Code du travail 2021, JO, doctrine) + pages web scrapées", cell)],
        [Paragraph("Export", bold), Paragraph("Markdown et PDF via reportlab", cell)],
    ]
    tbl = Table(rows, colWidths=[35 * mm, 130 * mm], hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return tbl


def _draw_header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, h - 18 * mm, w - 20 * mm, h - 18 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, h - 14 * mm, "Info Juridique Citoyenne — République gabonaise")
    canvas.drawRightString(w - 20 * mm, h - 14 * mm, f"Édition {date.today().isoformat()}")

    canvas.line(20 * mm, 16 * mm, w - 20 * mm, 16 * mm)
    canvas.drawString(20 * mm, 10 * mm, "Document de présentation — usage interne")
    canvas.drawRightString(w - 20 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build() -> Path:
    styles = _styles()
    OUT.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        title="Info Juridique Citoyenne — Présentation",
        author="Projet Info Juridique Citoyenne",
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=25 * mm,
        bottomMargin=22 * mm,
    )

    story: list = []

    # --- Page de garde ---
    story += [
        Paragraph("⚖️  RÉPUBLIQUE GABONAISE · INFORMATION JURIDIQUE", styles["badge"]),
        Spacer(1, 6),
        Paragraph("Info Juridique Citoyenne", styles["title"]),
        Paragraph(
            "Agent conversationnel de vulgarisation du droit gabonais — "
            "droit du travail, foncier et de la famille.",
            styles["subtitle"],
        ),
    ]

    # --- Résumé exécutif ---
    story += _md_to_flowables(
        """# Résumé exécutif

**Info Juridique Citoyenne** est un agent conversationnel destiné au grand public gabonais. Il répond en français, en langage simple, à des questions juridiques concrètes — en s'appuyant uniquement sur un corpus de textes officiels gabonais (Code du travail, Journal officiel, doctrine) et en citant systématiquement ses sources.

Contrairement à un simple chatbot RAG, l'application est construite comme un **agent avec outils** : le modèle de langage décide lui-même des actions à entreprendre — rechercher dans le corpus, lire un article précis, calculer une indemnité, produire une synthèse ou un rapport — et les enchaîne jusqu'à formuler une réponse fondée et citée.
""",
        styles,
    )

    story += [
        Spacer(1, 10),
        _stack_table(styles),
        Spacer(1, 4),
        Paragraph(
            "Stack technique synthétique. Tous les tunables sont centralisés dans "
            "<font name=\"Courier\" size=\"9\">src/config.py</font>.",
            styles["caption"],
        ),
    ]

    story.append(PageBreak())

    # --- Ce qui a été réalisé ---
    story += _md_to_flowables(
        """# Ce qui a été réalisé

## 1. Socle RAG et corpus juridique
- **Ingestion unifiée** de deux types de sources dans une collection Chroma unique (`droit_gabonais`) :
  - PDFs officiels du dossier `data/pdfs/`, listés dans un `manifest.yaml` qui garantit la traçabilité (fichier → domaine → libellé de source).
  - Pages web autoritatives listées dans `data/web_sources.yaml`, scrapées au moment de l'indexation avec extraction défensive du contenu utile.
- **Chunking** avec limite `CHUNK_MAX_CHARS` et conservation des métadonnées : domaine, source humaine, numéro d'article quand détecté, type de source.
- **Embeddings multilingues** `intfloat/multilingual-e5-base` avec gestion rigoureuse des préfixes `passage:` / `query:` requis par le modèle — garantit la qualité de retrieval en français.
- **Ingestion idempotente** : la collection est recréée à chaque exécution, les erreurs réseau n'interrompent pas le pipeline.

## 2. Agent avec boucle d'outils (tool use)
- Remplacement du pipeline RAG linéaire par un **véritable agent Groq** : le LLM sélectionne les outils, consomme leurs résultats, et boucle jusqu'à produire une réponse textuelle streamée.
- **Cinq outils** instrumentés (détaillés ci-dessous).
- **Fallback de modèle** automatique (`llama-3.3-70b` → `llama-3.1-8b`) si le modèle principal devient indisponible.
- **Garde-fou d'itérations** (`MAX_AGENT_ITERATIONS`) pour éviter toute boucle infinie.

## 3. Outils avancés : synthèse et rapport
- **`synthese_document`** : produit une synthèse en 5 à 10 points clés, fidèle aux extraits, avec citations intégrées.
- **`generer_rapport`** : rédige un rapport structuré (contexte, cadre juridique, points clés, démarches pratiques, avertissement).
- Les deux outils sont **utilisables par le LLM** (appel automatique quand la question l'appelle) **et directement par l'utilisateur** via les boutons dédiés sous chaque réponse.
- **Export Markdown et PDF** du rapport, générés côté serveur avec `reportlab`.

## 4. Analyse de documents utilisateur
- Upload d'un PDF (contrat, jugement, circulaire) depuis la barre latérale.
- Indexation à la volée dans une **collection éphémère** séparée (`droit_gabonais_uploads`), recréée à chaque nouvel upload et libérée en fin de session.
- Fusion transparente avec le corpus officiel : les questions de l'utilisateur prennent simultanément en compte le corpus permanent et le document téléversé.

## 5. Interface institutionnelle
- Charte visuelle sobre — bleu marine, typographie `Libre Baskerville` / `Inter`, responsive mobile.
- **Empty state** avec suggestions de questions cliquables pour guider le premier usage.
- **Panneau « Aller plus loin »** sous chaque réponse : synthèse, rapport, téléchargement `.md` et `.pdf`.
- **Expander « Sources citées »** par réponse, avec badge typé (PDF, web, document uploadé) et score de pertinence.
- **Filtre par domaine** (travail / foncier / famille / tous) via un segmented control.
- **Streaming token par token** pour la réponse de l'agent.
""",
        styles,
    )

    story.append(PageBreak())

    # --- Fonctionnalités ---
    story += _md_to_flowables(
        """# Fonctionnalités actuelles

## Pour l'utilisateur final

- **Poser une question juridique en langage courant.** L'agent reformule, recherche dans le corpus, et répond en français vulgarisé.
- **Citer ses sources systématiquement.** Chaque affirmation juridique est rattachée à un article précis au format `[Source : <code>, <article>]`.
- **Naviguer par domaine** : travail, foncier, famille, ou recherche transverse.
- **Obtenir un calcul concret.** Préavis et indemnités de licenciement selon le Code du travail gabonais (Art. 72 et 75).
- **Générer une synthèse** en bullets à partir d'une réponse existante.
- **Générer un rapport structuré** téléchargeable en Markdown ou PDF, prêt à être partagé avec un avocat ou utilisé comme pièce d'information.
- **Analyser un document personnel** (PDF) en le téléversant ponctuellement.
- **Historique de conversation** persistant pendant la session, effaçable d'un clic.
- **Avertissement légal explicite** rappelé dans la barre latérale et clôturant chaque réponse.

## Pour le développeur / le mainteneur
- Architecture modulaire — agent, outils, retriever, loaders, synthesizer découplés.
- Configuration centralisée dans `src/config.py`.
- Ajout d'un nouvel outil : schéma JSON + branche d'exécution + mention dans le prompt système.
- Ajout d'un nouveau PDF : dépôt du fichier + entrée dans `manifest.yaml` + ré-ingestion.
- Ajout d'une nouvelle URL : entrée dans `web_sources.yaml` + ré-ingestion.
""",
        styles,
    )

    story += [Spacer(1, 6), Paragraph("Inventaire des outils de l'agent", styles["h2"]), Spacer(1, 4), _tools_table(styles)]

    story.append(PageBreak())

    # --- Invariants + limites ---
    story += _md_to_flowables(
        """# Invariants techniques à préserver

- **Préfixes e5** (`passage:` à l'indexation, `query:` à la recherche) : ne pas router les requêtes par la fonction d'embedding Chroma sous peine de dégrader silencieusement la qualité de retrieval.
- **Fallback Groq** : conserver la double-tentative modèle principal / modèle secours dans `GroqLLM`.
- **Ingestion destructive** : la collection principale est recréée à chaque exécution — pas de persistance incrémentale, c'est volontaire.
- **Prompt système** : quatre règles non négociables — réponse fondée sur le contexte, citation systématique, reconnaissance de l'hors-périmètre, avertissement légal en clôture.
- **Cache Streamlit** : `get_agent()` est un singleton `@st.cache_resource` qui pré-chauffe le modèle d'embedding pour supprimer le cold start de la première question.
- **Fallback sources côté UI** : si l'agent répond sans appeler d'outil, l'application relance elle-même une recherche pour alimenter les boutons synthèse / rapport.

# Limites connues et prochaines étapes

- **Corpus à élargir.** Les domaines foncier et famille annoncés nécessitent encore l'ajout des textes de référence correspondants.
- **Pas de re-ranker.** Un modèle de re-ranking (par exemple `bge-reranker`) appliqué au top-k initial améliorerait la précision des extraits retenus.
- **Recherche purement dense.** Une recherche hybride (BM25 + dense) serait mieux adaptée aux requêtes contenant des numéros d'articles ou des termes juridiques exacts.
- **Découpage non conscient des articles.** Chunking sur caractères, sans alignement sur les frontières d'articles — à terme, parser les numéros et remplir le champ `article` plus finement.
- **Pas de tests automatisés** ni d'observabilité structurée (logs JSONL, feedback utilisateur).
- **Pas d'historique persistant** entre sessions — un refresh du navigateur réinitialise la conversation.

# Avertissement

Cet outil fournit des **informations juridiques générales** à vocation pédagogique. Il ne constitue **pas un conseil juridique** et ne se substitue pas à l'expertise d'un avocat ou d'un professionnel du droit. Les textes du corpus doivent être recoupés avec les publications officielles avant tout usage contentieux.
""",
        styles,
    )

    doc.build(story, onFirstPage=_draw_header_footer, onLaterPages=_draw_header_footer)
    return OUT


if __name__ == "__main__":
    path = build()
    print(f"PDF généré : {path}")
