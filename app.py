"""Interface Streamlit — Agent Info Juridique Citoyenne (Gabon)."""

from __future__ import annotations

from pathlib import Path

import streamlit as st

from src.agent.agent import LegalAgent
from src.config import CHROMA_PATH, DOMAINES, GROQ_API_KEY
from src.rag.retriever import LegalChunk

# --- Configuration de la page ---
st.set_page_config(
    page_title="Info Juridique Citoyenne — Gabon",
    page_icon="⚖️",
    layout="centered",
    initial_sidebar_state="collapsed",
)

DOMAINE_CHOICES = {"Tous les domaines": None} | {
    meta["label"]: key for key, meta in DOMAINES.items()
}

# --- CSS personnalisé (rendu institutionnel + responsive mobile) ---
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Libre+Baskerville:wght@700&display=swap');

    /* Masquer les éléments Streamlit pour un rendu plus pro */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header [data-testid="stHeader"] {background: transparent;}
    .stDeployButton {display: none;}

    /* Palette & typographie globale */
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #1a2332;
    }
    .stApp {
        background-color: #f7f7f5;
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
    }
    .stButton > button:hover {
        background: #1f3652;
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


# --- Initialisation de l'agent (cache) ---
@st.cache_resource(show_spinner="Chargement de l'agent juridique…")
def get_agent() -> LegalAgent:
    return LegalAgent()


def ensure_prerequisites() -> bool:
    """Vérifie la présence de la clé API et de la base vectorielle."""
    ok = True
    if not GROQ_API_KEY:
        st.error(
            "**Clé API Groq manquante.** Copiez `.env.example` vers `.env` et "
            "renseignez votre `GROQ_API_KEY` (https://console.groq.com/keys)."
        )
        ok = False
    if not Path(CHROMA_PATH).exists():
        with st.spinner("Construction de la base vectorielle (première exécution)…"):
            from src.rag.ingest import main as ingest_main

            ingest_main()
    return ok


def render_sources(chunks: list[LegalChunk]) -> None:
    """Affiche les sources citées dans un expander."""
    if not chunks:
        return
    with st.expander(f"📚 {len(chunks)} source(s) citée(s)"):
        for i, c in enumerate(chunks, start=1):
            st.markdown(
                f'<div class="source-head">{i}. {c.citation}</div>'
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


# --- Sidebar ---
with st.sidebar:
    st.markdown("### Info Juridique Citoyenne")
    st.caption("Agent de vulgarisation du droit gabonais")
    st.divider()

    if st.button("Effacer l'historique", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

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

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("sources"):
            render_sources(msg["sources"])

# --- Input utilisateur ---
user_question = st.chat_input("Votre question juridique…")

if user_question:
    # Affichage du message utilisateur
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
        try:
            stream, sources = agent.answer(
                question=user_question,
                domaine=selected_domaine,
                history=history_for_llm,
            )
            full_response = st.write_stream(stream)
            render_sources(sources)
        except Exception as exc:  # noqa: BLE001
            st.error(f"Erreur lors de la génération de la réponse : {exc}")
            full_response = ""
            sources = []

    if full_response:
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": full_response,
                "sources": sources,
            }
        )
