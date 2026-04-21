"""Calcul déterministe des indemnités et préavis — Code du travail gabonais.

Barèmes basés sur les Articles 72 (préavis) et 75 (indemnité de licenciement)
du Code du travail gabonais (Loi n° 3/94). Les taux utilisés ici sont des
barèmes simplifiés à vocation pédagogique.
"""

from __future__ import annotations


def calculer_preavis(anciennete_annees: float) -> dict:
    """Calcule la durée de préavis selon l'ancienneté (Article 72).

    Barème simplifié :
    - < 1 an  : 15 jours
    - 1–5 ans : 1 mois
    - 5–10 ans : 2 mois
    - > 10 ans : 3 mois
    """
    if anciennete_annees < 1:
        duree, unite = 15, "jours"
    elif anciennete_annees < 5:
        duree, unite = 1, "mois"
    elif anciennete_annees < 10:
        duree, unite = 2, "mois"
    else:
        duree, unite = 3, "mois"
    return {"duree": duree, "unite": unite}


def calculer_indemnite_licenciement(
    anciennete_annees: float,
    salaire_mensuel: float,
) -> dict:
    """Calcule l'indemnité de licenciement selon l'ancienneté (Article 75).

    Barème simplifié (pourcentage du salaire mensuel par année de présence) :
    - Années 1 à 5   : 20 % du salaire mensuel par année
    - Années 6 à 10  : 25 % du salaire mensuel par année
    - Au-delà de 10  : 30 % du salaire mensuel par année
    """
    indemnite = 0.0
    annees_restantes = anciennete_annees

    # Tranche 1 : 0–5 ans à 20 %
    tranche1 = min(annees_restantes, 5)
    indemnite += tranche1 * salaire_mensuel * 0.20
    annees_restantes -= tranche1

    # Tranche 2 : 5–10 ans à 25 %
    if annees_restantes > 0:
        tranche2 = min(annees_restantes, 5)
        indemnite += tranche2 * salaire_mensuel * 0.25
        annees_restantes -= tranche2

    # Tranche 3 : > 10 ans à 30 %
    if annees_restantes > 0:
        indemnite += annees_restantes * salaire_mensuel * 0.30

    return {"montant": round(indemnite), "devise": "FCFA"}


def calculer(
    anciennete_annees: float,
    salaire_mensuel: float,
    motif: str,
) -> str:
    """Point d'entrée principal. Retourne un texte formaté avec le résultat."""
    if anciennete_annees < 0:
        return "Erreur : l'ancienneté ne peut pas être négative."
    if salaire_mensuel <= 0:
        return "Erreur : le salaire mensuel doit être supérieur à zéro."

    preavis = calculer_preavis(anciennete_annees)
    lines = [
        f"**Calcul pour {anciennete_annees} an(s) d'ancienneté, "
        f"salaire mensuel de {salaire_mensuel:,.0f} FCFA**\n",
        f"**Préavis (Article 72)** : {preavis['duree']} {preavis['unite']}",
    ]

    if motif == "licenciement":
        indemnite = calculer_indemnite_licenciement(anciennete_annees, salaire_mensuel)
        lines.append(
            f"**Indemnité de licenciement (Article 75)** : "
            f"{indemnite['montant']:,} {indemnite['devise']}"
        )
        lines.append(
            "\n_Détail du barème :_\n"
            "- Années 1 à 5 : 20 % du salaire mensuel par année\n"
            "- Années 6 à 10 : 25 % du salaire mensuel par année\n"
            "- Au-delà de 10 ans : 30 % du salaire mensuel par année"
        )
    else:
        lines.append(
            "**Indemnité de licenciement** : non applicable (démission volontaire)."
        )

    lines.append(
        "\n_Sources : Code du travail gabonais, Articles 72 et 75._"
    )
    return "\n".join(lines)
