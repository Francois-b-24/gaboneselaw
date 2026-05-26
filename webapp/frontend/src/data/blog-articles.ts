export type Locale = "fr" | "en";

export type BlogSection = {
  heading: string;
  level?: "h2" | "h3";
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
  link?: { label: string; href: string };
};

// Fields shared across locales (never translated).
type BlogArticleShared = {
  slug: string;
  date: string;
  coverImage: string;
};

// Fields translated per locale.
type BlogArticleLocalized = {
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  coverAlt: string;
  intro: string;
  sections: BlogSection[];
};

type BlogArticleEntry = BlogArticleShared & {
  translations: Record<Locale, BlogArticleLocalized>;
};

// A fully-resolved article for one locale.
export type LocalizedBlogArticle = BlogArticleShared & BlogArticleLocalized;

const BLOG_ARTICLES: BlogArticleEntry[] = [
  {
    slug: "comprendre-le-code-civil-gabonais-en-5-minutes",
    date: "2026-04-03",
    coverImage:
      "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1400&q=80",
    translations: {
      fr: {
        title: "Comprendre le Code civil gabonais en 5 minutes",
        category: "Droit civil",
        excerpt:
          "Un guide rapide pour identifier les notions essentielles du Code civil et savoir où commencer selon votre situation.",
        readTime: "6 min",
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
      en: {
        title: "Understanding the Gabonese Civil Code in 5 minutes",
        category: "Civil law",
        excerpt:
          "A quick guide to identifying the essential concepts of the Civil Code and knowing where to start based on your situation.",
        readTime: "6 min",
        coverAlt: "Open legal code on a desk",
        intro:
          "The Civil Code can seem intimidating. Yet, with a few simple landmarks, it becomes a useful tool for understanding your everyday rights.",
        sections: [
          {
            heading: "Why this text is central",
            level: "h2",
            paragraphs: [
              "The Civil Code structures many everyday matters: obligations, contracts, liability, family and assets.",
              "Before looking for a detailed answer, it helps to define your need: dispute, contract, evidence, inheritance or family relationship.",
            ],
          },
          {
            heading: "Three reflexes before taking any step",
            level: "h3",
            bullets: [
              "Gather the factual documents (contract, messages, receipts, certificates).",
              "Identify the important dates so you do not miss a deadline.",
              "Compare your situation with similar cases before acting.",
            ],
          },
          {
            heading: "The right level of support",
            level: "h2",
            quote:
              "Better understanding the rule already helps you communicate better with a legal professional.",
            paragraphs: [
              "A first level of clear information helps you formulate precise questions and save time during a consultation.",
            ],
            link: { label: "Explore the project manifesto", href: "/manifeste" },
          },
        ],
      },
    },
  },
  {
    slug: "ia-et-acces-au-droit-pour-tous",
    date: "2026-03-19",
    coverImage:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    translations: {
      fr: {
        title: "L'IA peut-elle démocratiser l'accès au droit ?",
        category: "Innovation juridique",
        excerpt:
          "Ce que l'intelligence artificielle peut apporter à la vulgarisation juridique, et les limites à garder en tête.",
        readTime: "7 min",
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
      en: {
        title: "Can AI democratize access to the law?",
        category: "Legal innovation",
        excerpt:
          "What artificial intelligence can bring to making the law accessible, and the limits to keep in mind.",
        readTime: "7 min",
        coverAlt: "Computer screen with a conversational interface",
        intro:
          "AI does not replace the law. It can, however, make it easier to access structured, contextualized and more readable information.",
        sections: [
          {
            heading: "What AI does well",
            level: "h2",
            paragraphs: [
              "It speeds up the search for information, offers summaries and helps rephrase complex concepts in plain language.",
              "For a non-specialist audience, this mediation is often decisive.",
            ],
          },
          {
            heading: "What it should not claim to do",
            level: "h2",
            quote:
              "An automatic answer with no source or context can be wrongly reassuring.",
            bullets: [
              "Provide certainties on matters that require a full analysis.",
              "Ignore factual nuances or regulatory updates.",
              "Substitute for personalized legal advice.",
            ],
          },
          {
            heading: "Toward responsible innovation",
            level: "h3",
            paragraphs: [
              "AI that is useful in law must remain transparent about its sources, its limits and its scope of use.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "reforme-fonciere-gabon-ce-qui-change",
    date: "2026-02-28",
    coverImage:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
    translations: {
      fr: {
        title: "Reforme fonciere au Gabon : ce qui change",
        category: "Actualite legislative",
        excerpt:
          "Lecture simplifiee des evolutions foncieres et de leurs effets concrets pour les particuliers et petites structures.",
        readTime: "8 min",
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
      en: {
        title: "Land reform in Gabon: what is changing",
        category: "Legislative news",
        excerpt:
          "A simplified reading of land-law developments and their concrete effects for individuals and small organizations.",
        readTime: "8 min",
        coverAlt: "Land plot with plans and administrative documents",
        intro:
          "Changes in land law are often perceived as technical. Yet they have very concrete consequences for the procedures involved.",
        sections: [
          {
            heading: "The immediate impacts to watch",
            level: "h2",
            paragraphs: [
              "Checking the required documents, clarifying the administrative contacts and anticipating processing times.",
              "Good preparation reduces the risk of getting stuck.",
            ],
          },
          {
            heading: "Practical checklist",
            level: "h3",
            bullets: [
              "Check the administrative status of the property.",
              "Keep all proof of payment and filing.",
              "Formalize each important step in writing.",
            ],
          },
          {
            heading: "Why teaching the rules matters",
            level: "h2",
            quote:
              "When the rule is understood, the procedure becomes a manageable journey.",
          },
        ],
      },
    },
  },
  {
    slug: "droit-du-travail-et-automatisation",
    date: "2026-02-10",
    coverImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    translations: {
      fr: {
        title: "Automatisation et droit du travail : points de vigilance",
        category: "Droit du travail",
        excerpt:
          "Comment adopter des outils automatiques sans fragiliser les droits des salaries ni les obligations de l'employeur.",
        readTime: "9 min",
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
      en: {
        title: "Automation and labour law: points of vigilance",
        category: "Labour law",
        excerpt:
          "How to adopt automated tools without weakening employees' rights or the employer's obligations.",
        readTime: "9 min",
        coverAlt: "Team in a meeting around a computer",
        intro:
          "Automation can be a lever for efficiency, provided it is framed by compliant and understandable practices.",
        sections: [
          {
            heading: "Inform before deploying",
            level: "h2",
            paragraphs: [
              "Employees must understand the purposes of the tools, the data processed and the consequences for their work.",
            ],
          },
          {
            heading: "Principles to respect",
            level: "h3",
            bullets: [
              "Proportionality of the controls and indicators monitored.",
              "Documentation of which decisions can and cannot be automated.",
              "Accessible mechanisms for appeal and explanation.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "preuve-numerique-bonnes-pratiques",
    date: "2026-01-22",
    coverImage:
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1400&q=80",
    translations: {
      fr: {
        title: "Preuve numerique : les bonnes pratiques a adopter",
        category: "Procedure",
        excerpt:
          "Conserver, organiser et presenter des preuves numeriques de maniere claire pour renforcer un dossier juridique.",
        readTime: "6 min",
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
      en: {
        title: "Digital evidence: best practices to adopt",
        category: "Procedure",
        excerpt:
          "Preserving, organizing and presenting digital evidence clearly to strengthen a legal case.",
        readTime: "6 min",
        coverAlt: "Documents and a computer on a work table",
        intro:
          "In practice, many disputes are decided by the quality of the evidence kept. A simple method can change the outcome of a case.",
        sections: [
          {
            heading: "Organize before arguing",
            level: "h2",
            paragraphs: [
              "Sort the documents chronologically and link each one to a specific fact. This discipline makes the case easier to read.",
            ],
          },
          {
            heading: "Elements to prepare",
            level: "h3",
            bullets: [
              "Legible copies of the essential exchanges.",
              "Context elements (dates, places, parties).",
              "A short factual summary to accompany the documents.",
            ],
          },
          {
            heading: "Going further",
            level: "h2",
            link: { label: "Browse all articles", href: "/blog" },
          },
        ],
      },
    },
  },
];

const DEFAULT_LOCALE: Locale = "fr";

function resolveLocale(locale: string): Locale {
  return locale === "en" ? "en" : DEFAULT_LOCALE;
}

function toLocalized(
  entry: BlogArticleEntry,
  locale: Locale,
): LocalizedBlogArticle {
  const { slug, date, coverImage, translations } = entry;
  return { slug, date, coverImage, ...translations[locale] };
}

export function getLocalizedArticles(locale: string): LocalizedBlogArticle[] {
  const resolved = resolveLocale(locale);
  return BLOG_ARTICLES.map((entry) => toLocalized(entry, resolved));
}

export function getLocalizedArticle(
  slug: string,
  locale: string,
): LocalizedBlogArticle | undefined {
  const entry = BLOG_ARTICLES.find((article) => article.slug === slug);
  if (!entry) {
    return undefined;
  }
  return toLocalized(entry, resolveLocale(locale));
}

export function getAllSlugs(): string[] {
  return BLOG_ARTICLES.map((article) => article.slug);
}
