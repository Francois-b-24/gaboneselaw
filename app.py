"""Interface Streamlit — Agent Info Juridique Citoyenne (Gabon)."""

from __future__ import annotations

import os

# Force pure-Python protobuf parser. Required on Streamlit Cloud where the
# resolved combination of protobuf + opentelemetry-proto stubs (pulled in by
# chromadb) is incompatible with the C++ descriptor API and crashes at import.
os.environ.setdefault("PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION", "python")

from pathlib import Path

import streamlit as st

from src.agent.agent import LegalAgent
from src.config import CHROMA_PATH, DOMAINES, GROQ_API_KEY
from src.rag.retriever import LegalChunk

# --- Configuration de la page ---
st.set_page_config(
    page_title="Info Juridique Citoyenne — Gabon",
    page_icon="⚖️",
    layout="wide",
)

DOMAINE_CHOICES = {"Tous les domaines": None} | {
    meta["label"]: key for key, meta in DOMAINES.items()
}


# --- Initialisation de l'agent (cache) ---
@st.cache_resource(show_spinner="Chargement de l'agent juridique…")
def get_agent() -> LegalAgent:
    return LegalAgent()


def ensure_prerequisites() -> bool:
    """Vérifie la présence de la clé API et de la base vectorielle."""
    ok = True
    if not GROQ_API_KEY:
        st.error(
            "❌ **Clé API Groq manquante.** Copiez `.env.example` vers `.env` et "
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
    with st.expander(f"📚 Sources citées ({len(chunks)})"):
        for i, c in enumerate(chunks, start=1):
            st.markdown(
                f"**{i}. {c.citation}**  \n"
                f"*Pertinence : {c.score:.2f}*"
            )
            st.markdown(f"> {c.text}")
            if i < len(chunks):
                st.divider()


# --- Sidebar ---
with st.sidebar:
    st.title("⚖️ Info Juridique Citoyenne")
    st.caption("Agent de vulgarisation du droit gabonais")
    st.divider()

    st.subheader("Filtrer par domaine")
    domaine_label = st.radio(
        "Domaine",
        options=list(DOMAINE_CHOICES.keys()),
        index=0,
        label_visibility="collapsed",
    )
    selected_domaine = DOMAINE_CHOICES[domaine_label]

    st.divider()
    if st.button("🗑️ Effacer l'historique", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

    st.divider()
    st.markdown(
        "### ⚠️ Avertissement\n"
        "Cet agent fournit des **informations juridiques générales** à titre "
        "éducatif. Il **ne remplace pas** la consultation d'un avocat ou d'un "
        "professionnel du droit pour votre situation personnelle."
    )
    st.caption("Domaines couverts : travail, foncier, famille")

# --- Zone principale ---
st.title("⚖️ Info Juridique Citoyenne — Gabon")
st.markdown(
    "Posez votre question sur le **droit gabonais** (travail, foncier, famille). "
    "L'agent vous répond en langage simple et cite les articles de loi pertinents."
)

if not ensure_prerequisites():
    st.stop()

agent = get_agent()

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
