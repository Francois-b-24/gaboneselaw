"""Interface Streamlit — Agent Info Juridique Citoyenne (Gabon)."""

from __future__ import annotations

import tempfile
from pathlib import Path

import streamlit as st

from src.agent.agent import LegalAgent
from src.agent.synthesizer import generer_rapport, markdown_to_pdf, synthese_document
from src.config import CHROMA_PATH, DOMAINES, GROQ_API_KEY, TOP_K
from src.rag.retriever import LegalChunk
from src.rag.upload_indexer import clear_upload_collection, index_uploaded_pdf

# --- Configuration de la page ---
st.set_page_config(
    page_title="Info Juridique Citoyenne — Gabon",
    page_icon="⚖️",
    layout="centered",
    initial_sidebar_state="collapsed",
    menu_items={
        "About": "Agent de vulgarisation du droit gabonais — travail, foncier, famille.",
    },
)

DOMAINE_CHOICES = {"Tous les domaines": None} | {
    meta["label"]: key for key, meta in DOMAINES.items()
}

SAMPLE_QUESTIONS = [
    "Quelle est la durée du préavis après 6 ans d'ancienneté ?",
    "Comment obtenir un titre foncier au Gabon ?",
    "Quelles sont les conditions du divorce par consentement mutuel ?",
    "Calcule mon indemnité pour 8 ans et 450 000 FCFA par mois",
]

# --- CSS personnalisé (rendu institutionnel + responsive mobile) ---
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@700&display=swap');

    /* Masquer les éléments Streamlit pour un rendu plus pro */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header [data-testid="stHeader"] {background: transparent;}
    .stDeployButton {display: none;}
    [data-testid="stStatusWidget"] {display: none;}

    /* Palette & typographie globale */
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #1a2332;
    }
    .stApp {
        background-color: #f7f7f5;
    }
    .block-container {
        max-width: 860px !important;
        padding-top: 2rem !important;
    }

    /* Titres en serif */
    h1, h2, h3 {
        font-family: 'Libre Baskerville', Georgia, serif !important;
        color: #1a2332 !important;
        letter-spacing: -0.01em;
    }
    h1 {
        font-size: 2.1rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.3rem !important;
    }
    h3 {
        font-size: 1.15rem !important;
        margin-top: 1.2rem !important;
    }

    /* Bandeau institutionnel */
    .gov-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #2c4a6e;
        background: #eef2f7;
        border: 1px solid #d6dfeb;
        padding: 4px 12px;
        border-radius: 999px;
        margin-bottom: 0.8rem;
    }
    .subtitle {
        color: #475569;
        font-size: 1rem;
        margin-top: 0.2rem;
        margin-bottom: 1.5rem;
        line-height: 1.55;
    }

    /* Messages de chat */
    [data-testid="stChatMessage"] {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1rem 1.1rem;
        margin-bottom: 0.8rem;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        word-break: break-word;
    }
    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
        border-left: 3px solid #2c4a6e;
        background: #fbfcfd;
    }
    [data-testid="stChatMessage"] p {
        line-height: 1.6;
    }

    /* Chat input */
    [data-testid="stChatInput"] {
        background: #ffffff;
        border-radius: 12px;
    }

    /* Boutons */
    .stButton > button {
        background: #2c4a6e;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        padding: 0.5rem 1rem;
        transition: background 0.15s ease;
    }
    .stButton > button:hover {
        background: #1f3652;
        color: #ffffff;
    }
    .stDownloadButton > button {
        background: #ffffff;
        color: #2c4a6e;
        border: 1px solid #2c4a6e;
        border-radius: 8px;
        font-weight: 500;
    }
    .stDownloadButton > button:hover {
        background: #2c4a6e;
        color: #ffffff;
    }

    /* Segmented control / radio horizontal */
    [data-testid="stSegmentedControl"] {
        margin-bottom: 1rem;
    }

    /* Expander Sources */
    [data-testid="stExpander"] {
        background: #fafaf8;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        margin-top: 0.5rem;
    }
    [data-testid="stExpander"] summary {
        font-size: 0.9rem;
        font-weight: 500;
    }

    /* Extrait d'article de loi */
    .legal-excerpt {
        background: #fbfaf5;
        border-left: 3px solid #2c4a6e;
        padding: 0.7rem 0.9rem;
        margin: 0.4rem 0 0.8rem 0;
        font-size: 0.9rem;
        color: #2a3544;
        border-radius: 0 6px 6px 0;
        line-height: 1.55;
    }
    .source-head {
        font-size: 0.92rem;
        font-weight: 600;
        color: #1a2332;
        margin-bottom: 0.15rem;
    }
    .source-score {
        font-size: 0.78rem;
        color: #6b7280;
        margin-bottom: 0.3rem;
    }
    .source-badge {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 1px 7px;
        border-radius: 999px;
        margin-left: 6px;
        vertical-align: middle;
    }
    .badge-upload { color: #7c3f1a; background: #fef3c7; border: 1px solid #fcd34d; }
    .badge-web    { color: #075985; background: #e0f2fe; border: 1px solid #7dd3fc; }
    .badge-pdf    { color: #5b21b6; background: #ede9fe; border: 1px solid #c4b5fd; }

    /* Panneau "Aller plus loin" */
    .next-step-panel {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1rem 1.1rem;
        margin-top: 0.8rem;
    }
    .next-step-title {
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #2c4a6e;
        margin-bottom: 0.6rem;
    }

    /* Avertissement sidebar */
    .disclaimer {
        background: #fff8e1;
        border-left: 3px solid #d97706;
        padding: 0.8rem 0.9rem;
        border-radius: 0 6px 6px 0;
        font-size: 0.85rem;
        color: #3f2d0a;
        line-height: 1.5;
    }
    .disclaimer strong {
        color: #92400e;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: #ffffff;
        border-right: 1px solid #e5e7eb;
    }

    /* Empty state — landing */
    .sample-label {
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #64748b;
        margin: 1.5rem 0 0.6rem 0;
    }

    /* --- Mobile tweaks --- */
    @media (max-width: 640px) {
        .block-container {
            padding-top: 1.5rem !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
        }
        h1 {
            font-size: 1.5rem !important;
            line-height: 1.25 !important;
        }
        .subtitle {
            font-size: 0.92rem;
        }
        [data-testid="stChatMessage"] {
            padding: 0.8rem 0.9rem;
            font-size: 0.95rem;
        }
        .legal-excerpt {
            font-size: 0.85rem;
        }
        .gov-badge {
            font-size: 0.65rem;
        }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# --- Initialisation de l'agent (cache + pré-chauffage embeddings) ---
@st.cache_resource(show_spinner="Chargement de l'agent juridique…")
def get_agent() -> LegalAgent:
    agent = LegalAgent()
    # Pré-chauffage : charge le modèle sentence-transformers et vectorise une
    # requête factice pour que la première vraie question ne supporte pas le
    # coût de chargement (plusieurs secondes en cold start).
    try:
        from src.rag.embeddings import embed_query
        embed_query("init")
    except Exception:
        pass
    return agent


def ensure_prerequisites() -> bool:
    """Vérifie la présence de la clé API et de la base vectorielle."""
    if not GROQ_API_KEY:
        st.error(
            "**Clé API Groq manquante.** Copiez `.env.example` vers `.env` et "
            "renseignez votre `GROQ_API_KEY` (https://console.groq.com/keys)."
        )
        return False
    if not Path(CHROMA_PATH).exists():
        with st.spinner("Construction de la base vectorielle (première exécution)…"):
            from src.rag.ingest import main as ingest_main
            ingest_main()
    return True


def _source_badge(c: LegalChunk) -> str:
    stype = c.metadata.get("source_type")
    if stype == "pdf_upload":
        return '<span class="source-badge badge-upload">Document uploadé</span>'
    if stype == "web":
        return '<span class="source-badge badge-web">Web</span>'
    if stype == "pdf":
        return '<span class="source-badge badge-pdf">PDF</span>'
    return ""


def render_sources(chunks: list[LegalChunk]) -> None:
    """Affiche les sources citées dans un expander."""
    if not chunks:
        return
    with st.expander(f"📚 {len(chunks)} source(s) citée(s)"):
        for i, c in enumerate(chunks, start=1):
            st.markdown(
                f'<div class="source-head">{i}. {c.citation}{_source_badge(c)}</div>'
                f'<div class="source-score">Pertinence : {c.score:.2f}</div>'
                f'<div class="legal-excerpt">{c.text}</div>',
                unsafe_allow_html=True,
            )


def pick_domain_control(labels: list[str]) -> str:
    """Segmented control si dispo (Streamlit ≥ 1.38), sinon radio horizontal."""
    if hasattr(st, "segmented_control"):
        return st.segmented_control(
            "Filtrer par domaine",
            options=labels,
            default=labels[0],
            label_visibility="collapsed",
        ) or labels[0]
    return st.radio(
        "Filtrer par domaine",
        options=labels,
        index=0,
        horizontal=True,
        label_visibility="collapsed",
    )


def _fetch_sources_fallback(agent: LegalAgent, query: str, domaine: str | None) -> list[LegalChunk]:
    """Récupère des sources si l'agent n'en a pas collecté (ex: réponse sans tool call)."""
    if not query:
        return []
    try:
        return agent.retriever.search(
            query,
            domaine=domaine,
            k=TOP_K,
            include_uploads=bool(st.session_state.get("has_upload")),
        )
    except Exception:
        return []


# --- Sidebar ---
with st.sidebar:
    st.markdown("### Info Juridique Citoyenne")
    st.caption("Agent de vulgarisation du droit gabonais")
    st.divider()

    if st.button("Effacer l'historique", use_container_width=True):
        st.session_state.messages = []
        st.session_state.pop("last_report", None)
        st.session_state.pop("last_synthesis", None)
        st.rerun()

    st.divider()
    st.markdown("#### Analyser un document")
    st.caption(
        "Déposez un PDF (contrat, jugement, circulaire) pour l'analyser avec l'agent. "
        "Le document n'est conservé que le temps de votre session."
    )
    uploaded_pdf = st.file_uploader(
        "PDF à analyser",
        type=["pdf"],
        label_visibility="collapsed",
        key="pdf_uploader",
    )
    if uploaded_pdf is not None:
        upload_sig = f"{uploaded_pdf.name}:{uploaded_pdf.size}"
        if st.session_state.get("_indexed_upload_sig") != upload_sig:
            with st.spinner("Indexation du PDF…"):
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                    tmp.write(uploaded_pdf.getvalue())
                    tmp_path = Path(tmp.name)
                n_chunks = index_uploaded_pdf(tmp_path, uploaded_pdf.name)
                tmp_path.unlink(missing_ok=True)
                st.session_state["_indexed_upload_sig"] = upload_sig
                st.session_state["has_upload"] = n_chunks > 0
                st.session_state["upload_name"] = uploaded_pdf.name
                st.session_state["upload_chunks"] = n_chunks
        if st.session_state.get("has_upload"):
            st.success(
                f"📄 **{st.session_state['upload_name']}** — "
                f"{st.session_state['upload_chunks']} extrait(s) indexé(s). "
                "Vos questions prendront aussi en compte ce document."
            )
        else:
            st.warning("Aucun texte n'a pu être extrait de ce PDF (scan sans OCR ?).")
    else:
        if st.session_state.get("has_upload"):
            clear_upload_collection()
            st.session_state["has_upload"] = False
            st.session_state.pop("_indexed_upload_sig", None)
            st.session_state.pop("upload_name", None)
            st.session_state.pop("upload_chunks", None)

    st.divider()
    st.markdown(
        '<div class="disclaimer">'
        "<strong>Avertissement.</strong> Cet agent fournit des informations "
        "juridiques générales à titre éducatif. Il ne remplace pas la "
        "consultation d'un avocat ou d'un professionnel du droit pour votre "
        "situation personnelle."
        "</div>",
        unsafe_allow_html=True,
    )
    st.caption("Domaines couverts : travail, foncier, famille")

# --- Zone principale ---
st.markdown(
    '<div class="gov-badge">⚖️ République gabonaise · Information juridique</div>',
    unsafe_allow_html=True,
)
st.markdown("# Info Juridique Citoyenne")
st.markdown(
    '<div class="subtitle">Vulgarisation du droit gabonais — travail, foncier, famille. '
    "Posez votre question, l'agent répond en langage simple et cite les articles de loi pertinents.</div>",
    unsafe_allow_html=True,
)

if not ensure_prerequisites():
    st.stop()

agent = get_agent()

# --- Filtre domaine (visible sur mobile) ---
domaine_label = pick_domain_control(list(DOMAINE_CHOICES.keys()))
selected_domaine = DOMAINE_CHOICES[domaine_label]

# --- Historique ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# Empty state — suggestions de questions
if not st.session_state.messages:
    st.markdown('<div class="sample-label">Exemples de questions</div>', unsafe_allow_html=True)
    cols = st.columns(2)
    for i, q in enumerate(SAMPLE_QUESTIONS):
        if cols[i % 2].button(q, key=f"sample-{i}", use_container_width=True):
            st.session_state["_pending_question"] = q
            st.rerun()

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("sources"):
            render_sources(msg["sources"])

# --- Input utilisateur ---
user_question = st.chat_input("Votre question juridique…")
# Support des suggestions cliquables
if not user_question and st.session_state.get("_pending_question"):
    user_question = st.session_state.pop("_pending_question")

if user_question:
    st.session_state.messages.append({"role": "user", "content": user_question})
    with st.chat_message("user"):
        st.markdown(user_question)

    # Historique envoyé au LLM (tout sauf le message courant)
    history_for_llm = [
        {"role": m["role"], "content": m["content"]}
        for m in st.session_state.messages[:-1]
    ]

    # Réponse de l'agent
    with st.chat_message("assistant"):
        full_response = ""
        response = None
        try:
            with st.spinner("Recherche dans le corpus juridique…"):
                response = agent.answer(
                    question=user_question,
                    domaine=selected_domaine,
                    history=history_for_llm,
                    include_uploads=bool(st.session_state.get("has_upload")),
                )
            full_response = st.write_stream(response)
            # Fallback : si l'agent n'a pas utilisé de tool, récupérer des sources
            sources = list(response.sources) if response else []
            if not sources:
                sources = _fetch_sources_fallback(agent, user_question, selected_domaine)
            render_sources(sources)
        except Exception as exc:  # noqa: BLE001
            st.error(f"Erreur lors de la génération de la réponse : {exc}")
            sources = []

    if full_response:
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": full_response,
                "sources": sources,
            }
        )
        # Reset des productions précédentes quand une nouvelle question arrive
        st.session_state.pop("last_report", None)
        st.session_state.pop("last_synthesis", None)


# --- Actions sur la dernière réponse : synthèse, rapport, export ---
def _last_assistant_message() -> dict | None:
    for msg in reversed(st.session_state.messages):
        if msg["role"] == "assistant":
            return msg
    return None


def _last_user_question() -> str:
    for msg in reversed(st.session_state.messages):
        if msg["role"] == "user":
            return msg["content"]
    return ""


last_assistant = _last_assistant_message()
if last_assistant:
    st.markdown('<div class="next-step-panel">', unsafe_allow_html=True)
    st.markdown(
        '<div class="next-step-title">Aller plus loin avec cette réponse</div>',
        unsafe_allow_html=True,
    )
    col1, col2 = st.columns(2)
    with col1:
        run_synth = st.button(
            "📋 Synthétiser les sources",
            use_container_width=True,
            key="btn_synth",
        )
    with col2:
        run_report = st.button(
            "📄 Générer un rapport",
            use_container_width=True,
            key="btn_report",
        )

    def _ensure_sources_for_action() -> list[LegalChunk]:
        """Récupère les sources (celles de la dernière réponse, ou nouvelles si absentes)."""
        existing = last_assistant.get("sources") or []
        if existing:
            return existing
        chunks = _fetch_sources_fallback(agent, _last_user_question(), selected_domaine)
        # Mémoriser pour les prochaines actions
        if chunks:
            last_assistant["sources"] = chunks
        return chunks

    if run_synth:
        with st.spinner("Synthèse en cours…"):
            try:
                chunks = _ensure_sources_for_action()
                if not chunks:
                    st.warning("Aucune source disponible pour la synthèse.")
                else:
                    text = synthese_document(chunks, focus=None, llm=agent.llm)
                    st.session_state["last_synthesis"] = text
                    # Invalider le rapport précédent pour éviter la confusion
                    st.session_state.pop("last_report", None)
            except Exception as exc:  # noqa: BLE001
                st.error(f"Erreur lors de la synthèse : {exc}")

    if run_report:
        with st.spinner("Rédaction du rapport…"):
            try:
                chunks = _ensure_sources_for_action()
                if not chunks:
                    st.warning("Aucune source disponible pour le rapport.")
                else:
                    sujet = _last_user_question() or "Rapport juridique"
                    report_md = generer_rapport(sujet=sujet, chunks=chunks, llm=agent.llm)
                    st.session_state["last_report"] = {"sujet": sujet, "md": report_md}
                    st.session_state.pop("last_synthesis", None)
            except Exception as exc:  # noqa: BLE001
                st.error(f"Erreur lors de la génération du rapport : {exc}")

    synthesis = st.session_state.get("last_synthesis")
    if synthesis:
        st.markdown("### Synthèse")
        st.markdown(synthesis)

    report = st.session_state.get("last_report")
    if report:
        st.markdown("### Rapport")
        st.markdown(report["md"])
        dl_col1, dl_col2 = st.columns(2)
        safe_name = "".join(c if c.isalnum() else "-" for c in report["sujet"]).strip("-")[:50] or "rapport"
        with dl_col1:
            st.download_button(
                "⬇️ Télécharger .md",
                data=report["md"].encode("utf-8"),
                file_name=f"{safe_name}.md",
                mime="text/markdown",
                use_container_width=True,
            )
        with dl_col2:
            try:
                pdf_bytes = markdown_to_pdf(report["md"], title=report["sujet"])
                st.download_button(
                    "⬇️ Télécharger .pdf",
                    data=pdf_bytes,
                    file_name=f"{safe_name}.pdf",
                    mime="application/pdf",
                    use_container_width=True,
                )
            except Exception as exc:  # noqa: BLE001
                st.caption(f"Export PDF indisponible : {exc}")
    st.markdown("</div>", unsafe_allow_html=True)
