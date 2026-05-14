export type BlogSection = {
  heading: string;
  level?: "h2" | "h3";
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
  link?: { label: string; href: string };
};

export type BlogArticle = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  readTime: string;
  coverImage: string;
  coverAlt: string;
  intro: string;
  sections: BlogSection[];
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "comprendre-le-code-civil-gabonais-en-5-minutes",
    title: "Comprendre le Code civil gabonais en 5 minutes",
    date: "2026-04-03",
    category: "Droit civil",
    excerpt:
      "Un guide rapide pour identifier les notions essentielles du Code civil et savoir où commencer selon votre situation.",
    readTime: "6 min",
    coverImage:
      "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1400&q=80",
    coverAlt: "Code juridique ouvert sur un bureau",
    intro:
      "Le Code civil peut paraître intimidant. Pourtant, avec quelques repères simples, il devient un outil utile pour comprendre ses droits au quotidien.",
    sections: [
      {
        heading: "Pourquoi ce texte est central",
        level: "h2",
        paragraphs: [
          "Le Code civil structure de nombreuses questions de la vie courante: obligations, contrats, responsabilité, famille ou patrimoine.",
          "Avant de chercher une réponse détaillée, il est utile de qualifier votre besoin: litige, contrat, preuve, succession ou relation familiale.",
        ],
      },
      {
        heading: "Trois réflexes avant toute démarche",
        level: "h3",
        bullets: [
          "Rassembler les documents factuels (contrat, messages, reçus, attestations).",
          "Identifier les dates importantes pour ne pas rater un délai.",
          "Comparer votre situation à des cas similaires avant d'agir.",
        ],
      },
      {
        heading: "Le bon niveau d'accompagnement",
        level: "h2",
        quote:
          "Mieux comprendre la règle permet déjà de mieux dialoguer avec un professionnel du droit.",
        paragraphs: [
          "Un premier niveau d'information claire aide à formuler des questions précises et à gagner du temps lors d'une consultation.",
        ],
        link: { label: "Explorer le manifeste du projet", href: "/manifeste" },
      },
    ],
  },
  {
    slug: "ia-et-acces-au-droit-pour-tous",
    title: "L'IA peut-elle démocratiser l'accès au droit ?",
    date: "2026-03-19",
    category: "Innovation juridique",
    excerpt:
      "Ce que l'intelligence artificielle peut apporter à la vulgarisation juridique, et les limites à garder en tête.",
    readTime: "7 min",
    coverImage:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    coverAlt: "Ecran d'ordinateur avec interface conversationnelle",
    intro:
      "L'IA ne remplace pas le droit. Elle peut en revanche faciliter l'accès à une information structurée, contextualisée et plus lisible.",
    sections: [
      {
        heading: "Ce que l'IA fait bien",
        level: "h2",
        paragraphs: [
          "Elle accélère la recherche d'informations, propose des synthèses et aide à reformuler des notions complexes en langage clair.",
          "Pour un public non spécialiste, cette médiation est souvent décisive.",
        ],
      },
      {
        heading: "Ce qu'elle ne doit pas pretendre faire",
        level: "h2",
        quote:
          "Une réponse automatique sans source ni contexte peut rassurer à tort.",
        bullets: [
          "Donner des certitudes sur des dossiers nécessitant une analyse complète.",
          "Ignorer les nuances factuelles ou les mises à jour normatives.",
          "Se substituer à un conseil juridique personnalisé.",
        ],
      },
      {
        heading: "Vers une innovation responsable",
        level: "h3",
        paragraphs: [
          "Une IA utile en droit doit rester transparente sur ses sources, ses limites et son périmètre d'usage.",
        ],
      },
    ],
  },
  {
    slug: "reforme-fonciere-gabon-ce-qui-change",
    title: "Reforme fonciere au Gabon : ce qui change",
    date: "2026-02-28",
    category: "Actualite legislative",
    excerpt:
      "Lecture simplifiee des evolutions foncieres et de leurs effets concrets pour les particuliers et petites structures.",
    readTime: "8 min",
    coverImage:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
    coverAlt: "Terrain avec plans et documents administratifs",
    intro:
      "Les changements en matiere fonciere sont souvent percus comme techniques. Pourtant, ils ont des consequences tres concretes sur les demarches.",
    sections: [
      {
        heading: "Les impacts immediats a surveiller",
        level: "h2",
        paragraphs: [
          "Verification des pieces exigibles, clarification des interlocuteurs administratifs et anticipation des delais de traitement.",
          "Une bonne preparation reduit les risques de blocage.",
        ],
      },
      {
        heading: "Checklist pratique",
        level: "h3",
        bullets: [
          "Verifier la situation administrative du bien.",
          "Conserver tous les justificatifs de paiement et de depot.",
          "Formaliser chaque etape importante par ecrit.",
        ],
      },
      {
        heading: "Pourquoi la pedagogie compte",
        level: "h2",
        quote:
          "Quand la regle est comprise, la demarche devient un parcours maitrisable.",
      },
    ],
  },
  {
    slug: "droit-du-travail-et-automatisation",
    title: "Automatisation et droit du travail : points de vigilance",
    date: "2026-02-10",
    category: "Droit du travail",
    excerpt:
      "Comment adopter des outils automatiques sans fragiliser les droits des salaries ni les obligations de l'employeur.",
    readTime: "9 min",
    coverImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    coverAlt: "Equipe en reunion autour d'un ordinateur",
    intro:
      "L'automatisation peut etre un levier d'efficacite, a condition d'etre encadree par des pratiques conformes et comprensibles.",
    sections: [
      {
        heading: "Informer avant de deployer",
        level: "h2",
        paragraphs: [
          "Les collaborateurs doivent comprendre les finalites des outils, les donnees traitees et les consequences sur leur activite.",
        ],
      },
      {
        heading: "Principes a respecter",
        level: "h3",
        bullets: [
          "Proportionnalite des controles et des indicateurs suivis.",
          "Documentation des decisions automatisables et non automatisables.",
          "Mecanismes de recours et d'explication accessibles.",
        ],
      },
    ],
  },
  {
    slug: "preuve-numerique-bonnes-pratiques",
    title: "Preuve numerique : les bonnes pratiques a adopter",
    date: "2026-01-22",
    category: "Procedure",
    excerpt:
      "Conserver, organiser et presenter des preuves numeriques de maniere claire pour renforcer un dossier juridique.",
    readTime: "6 min",
    coverImage:
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1400&q=80",
    coverAlt: "Documents et ordinateur sur une table de travail",
    intro:
      "En pratique, beaucoup de litiges se jouent sur la qualite des preuves conservees. Une methode simple peut changer l'issue d'un dossier.",
    sections: [
      {
        heading: "Organiser avant d'argumenter",
        level: "h2",
        paragraphs: [
          "Classez les pieces par chronologie et reliez chaque document a un fait precis. Cette discipline facilite la lecture du dossier.",
        ],
      },
      {
        heading: "Elements a preparer",
        level: "h3",
        bullets: [
          "Copies lisibles des echanges essentiels.",
          "Elements de contexte (dates, lieux, parties).",
          "Resume factuel court pour accompagner les pieces.",
        ],
      },
      {
        heading: "Aller plus loin",
        level: "h2",
        link: { label: "Parcourir tous les articles", href: "/blog" },
      },
    ],
  },
];

export function getBlogArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}
