/**
 * Extrait retiré de webapp/frontend/src/components/ui/landing-page.tsx
 * (entrée du tableau `sections` pour la landing scroll).
 * À réinsérer entre la section "blog" et la section "contacts" si restauration.
 */
    {
      id: "chatbot",
      badge: "Chatbot",
      title: "Un assistant IA juridique",
      subtitle: "centré sur le Gabon",
      description:
        "Pose tes questions et obtiens une réponse structurée pour mieux comprendre tes droits, avec une approche pédagogique orientée vers le droit gabonais.",
      align: "left",
      actions: [
        {
          label: "Ouvrir le chatbot",
          variant: "primary",
          onClick: () => goTo("/chatbot"),
        },
      ],
    },
