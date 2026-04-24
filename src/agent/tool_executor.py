"""Dispatch et exécution des outils de l'agent juridique."""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.agent.calculator import calculer
from src.agent.prompts import format_context
from src.agent.synthesizer import generer_rapport, synthese_document
from src.rag.retriever import LegalChunk, LegalRetriever

if TYPE_CHECKING:
    from src.agent.llm import AnthropicLLM


def execute_tool(
    tool_name: str,
    arguments: dict,
    retriever: LegalRetriever,
    domaine_hint: str | None = None,
    llm: "AnthropicLLM | None" = None,
    include_uploads: bool = False,
) -> tuple[str, list[LegalChunk]]:
    """Exécute un outil et retourne (texte résultat, chunks juridiques trouvés).

    :param tool_name: nom de la fonction appelée par le LLM
    :param arguments: arguments parsés (dict) de l'appel
    :param retriever: instance du retriever ChromaDB
    :param domaine_hint: domaine sélectionné par l'utilisateur (hint)
    :param llm: client Anthropic (requis pour synthese_document et generer_rapport)
    :param include_uploads: fusionne la collection d'uploads dans les recherches
    """
    if tool_name == "recherche_juridique":
        return _exec_recherche(arguments, retriever, domaine_hint, include_uploads)
    if tool_name == "lire_article":
        return _exec_lire_article(arguments, retriever, domaine_hint)
    if tool_name == "calculer_indemnite":
        return _exec_calculer(arguments)
    if tool_name == "synthese_document":
        return _exec_synthese(arguments, retriever, domaine_hint, llm, include_uploads)
    if tool_name == "generer_rapport":
        return _exec_rapport(arguments, retriever, domaine_hint, llm, include_uploads)
    return f"Outil inconnu : {tool_name}", []


def _exec_recherche(
    args: dict,
    retriever: LegalRetriever,
    domaine_hint: str | None,
    include_uploads: bool,
) -> tuple[str, list[LegalChunk]]:
    query = args.get("query", "")
    domaine = args.get("domaine") or domaine_hint
    k = min(args.get("k", 5), 10)

    chunks = retriever.search(query, domaine=domaine, k=k, include_uploads=include_uploads)
    if not chunks:
        return "Aucun résultat trouvé dans la base juridique pour cette requête.", []
    return format_context(chunks), chunks


def _exec_lire_article(
    args: dict,
    retriever: LegalRetriever,
    domaine_hint: str | None,
) -> tuple[str, list[LegalChunk]]:
    article = args.get("article", "")
    domaine = args.get("domaine") or domaine_hint

    chunks = retriever.get_article(article, domaine=domaine)
    if not chunks:
        return f"Article « {article} » non trouvé dans la base juridique.", []
    return format_context(chunks), chunks


def _exec_calculer(args: dict) -> tuple[str, list[LegalChunk]]:
    anciennete = args.get("anciennete_annees", 0)
    salaire = args.get("salaire_mensuel", 0)
    motif = args.get("motif", "licenciement")

    result = calculer(anciennete, salaire, motif)
    return result, []


def _exec_synthese(
    args: dict,
    retriever: LegalRetriever,
    domaine_hint: str | None,
    llm: "AnthropicLLM | None",
    include_uploads: bool,
) -> tuple[str, list[LegalChunk]]:
    if llm is None:
        return "Outil 'synthese_document' indisponible (LLM non fourni).", []
    query = args.get("query", "")
    domaine = args.get("domaine") or domaine_hint
    focus = args.get("focus")

    chunks = retriever.search(query, domaine=domaine, k=10, include_uploads=include_uploads)
    text = synthese_document(chunks, focus, llm)
    return text, chunks


def _exec_rapport(
    args: dict,
    retriever: LegalRetriever,
    domaine_hint: str | None,
    llm: "AnthropicLLM | None",
    include_uploads: bool,
) -> tuple[str, list[LegalChunk]]:
    if llm is None:
        return "Outil 'generer_rapport' indisponible (LLM non fourni).", []
    sujet = args.get("sujet", "")
    domaine = args.get("domaine") or domaine_hint

    chunks = retriever.search(sujet, domaine=domaine, k=10, include_uploads=include_uploads)
    text = generer_rapport(sujet, chunks, llm)
    return text, chunks
