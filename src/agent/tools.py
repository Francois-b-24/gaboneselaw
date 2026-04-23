"""Définitions des outils (tool use) pour l'agent juridique gabonais."""

from __future__ import annotations

TOOL_RECHERCHE_JURIDIQUE = {
    "type": "function",
    "function": {
        "name": "recherche_juridique",
        "description": (
            "Recherche sémantique dans le corpus juridique gabonais. "
            "Utilise cet outil pour trouver des articles de loi pertinents "
            "avant de répondre à une question juridique."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Requête de recherche décrivant le sujet juridique",
                },
                "domaine": {
                    "type": "string",
                    "enum": ["travail", "foncier", "famille"],
                    "description": "Domaine juridique pour filtrer les résultats (optionnel)",
                },
                "k": {
                    "type": "integer",
                    "description": "Nombre de résultats à retourner (défaut : 5, max : 10)",
                },
            },
            "required": ["query"],
        },
    },
}

TOOL_LIRE_ARTICLE = {
    "type": "function",
    "function": {
        "name": "lire_article",
        "description": (
            "Lire le texte complet d'un article de loi spécifique par son numéro. "
            "Utilise cet outil quand le citoyen demande un article précis "
            "ou quand tu as besoin du texte exact d'un article."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "article": {
                    "type": "string",
                    "description": "Numéro ou nom de l'article (ex: '72', 'Article 75')",
                },
                "domaine": {
                    "type": "string",
                    "enum": ["travail", "foncier", "famille"],
                    "description": "Domaine juridique pour filtrer (optionnel)",
                },
            },
            "required": ["article"],
        },
    },
}

TOOL_CALCULER_INDEMNITE = {
    "type": "function",
    "function": {
        "name": "calculer_indemnite",
        "description": (
            "Calcule l'indemnité de licenciement et la durée de préavis selon "
            "le Code du travail gabonais (Articles 72 et 75). "
            "Utilise cet outil quand le citoyen demande un calcul concret."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "anciennete_annees": {
                    "type": "number",
                    "description": "Ancienneté du salarié en années",
                },
                "salaire_mensuel": {
                    "type": "number",
                    "description": "Salaire mensuel brut en FCFA",
                },
                "motif": {
                    "type": "string",
                    "enum": ["licenciement", "demission"],
                    "description": "Motif de la rupture du contrat",
                },
            },
            "required": ["anciennete_annees", "salaire_mensuel", "motif"],
        },
    },
}

TOOL_SYNTHESE_DOCUMENT = {
    "type": "function",
    "function": {
        "name": "synthese_document",
        "description": (
            "Produit une synthèse en bullets des règles juridiques sur un sujet. "
            "À utiliser UNIQUEMENT quand le citoyen demande explicitement une "
            "synthèse, un résumé ou une vue d'ensemble sur un sujet juridique."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Sujet à synthétiser (sert aussi à récupérer les extraits)",
                },
                "domaine": {
                    "type": "string",
                    "enum": ["travail", "foncier", "famille"],
                    "description": "Domaine juridique pour filtrer (optionnel)",
                },
                "focus": {
                    "type": "string",
                    "description": "Angle particulier à privilégier dans la synthèse (optionnel)",
                },
            },
            "required": ["query"],
        },
    },
}


TOOL_GENERER_RAPPORT = {
    "type": "function",
    "function": {
        "name": "generer_rapport",
        "description": (
            "Rédige un rapport juridique structuré (contexte, cadre, points clés, "
            "démarches pratiques) sur un sujet donné. À utiliser UNIQUEMENT quand le "
            "citoyen demande explicitement un rapport ou un document structuré."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "sujet": {
                    "type": "string",
                    "description": "Sujet du rapport (ex: 'Licenciement abusif au Gabon')",
                },
                "domaine": {
                    "type": "string",
                    "enum": ["travail", "foncier", "famille"],
                    "description": "Domaine juridique pour filtrer (optionnel)",
                },
            },
            "required": ["sujet"],
        },
    },
}


ALL_TOOLS: list[dict] = [
    TOOL_RECHERCHE_JURIDIQUE,
    TOOL_LIRE_ARTICLE,
    TOOL_CALCULER_INDEMNITE,
    TOOL_SYNTHESE_DOCUMENT,
    TOOL_GENERER_RAPPORT,
]
