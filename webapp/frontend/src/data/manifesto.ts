export type ManifestoSection = {
  heading: string;
  subtitle?: string;
  paragraphs?: string[];
  subsections?: { heading: string; paragraphs: string[] }[];
  numbered?: { label: string; body: string }[];
  axes?: { label: string; body: string }[];
  joinList?: { term: string; detail: string }[];
};

export type Manifesto = {
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
  launch: string;
  sections: ManifestoSection[];
  quote: { line1: string; line2: string };
  footerName: string;
  footerPlace: string;
};

const fr: Manifesto = {
  eyebrow: "Notre position",
  title: "Manifeste",
  accent: "Affirmer l’expertise juridique africaine.",
  lede: "Une affirmation publique de notre vision : un droit africain pensé, écrit et outillé par des juristes africains, à l’ère de l’intelligence artificielle.",
  launch: "Lancement officiel · Libreville, 16 avril 2026 · Forum Cyber’Elles",
  sections: [
    {
      heading: "Pourquoi ALIN existe",
      paragraphs: [
        "Les métiers du droit traversent une mutation profonde. Recherche juridique, rédaction contractuelle, contentieux, conformité, gouvernance — l’intelligence artificielle transforme déjà les pratiques et redéfinit les compétences attendues des professionnels du droit.",
        "ALIN est née pour affirmer la voix des juristes africains francophones dans cette transformation, et pour faire de l’Afrique un contributeur à part entière dans la construction des normes de l’intelligence artificielle.",
      ],
    },
    {
      heading: "01 — Le double constat",
      subtitle: "Une transformation mondiale. Une absence africaine.",
      paragraphs: [
        "Pendant que les cadres normatifs de l’intelligence artificielle se dessinent à l’échelle mondiale, l’espace africain francophone demeure largement sous-représenté dans les dynamiques internationales de gouvernance.",
        "Cette absence n’est pas anodine. Elle fragilise la capacité des juristes africains à anticiper, influencer et encadrer les évolutions qui structureront leur profession et leurs économies pour les décennies à venir.",
      ],
      subsections: [
        {
          heading: "Constat 01 — L’IA mute les professions juridiques",
          paragraphs: [
            "La montée en puissance de l’intelligence artificielle redéfinit en profondeur les compétences attendues, les pratiques professionnelles et les modèles économiques des cabinets et directions juridiques.",
          ],
        },
        {
          heading: "Constat 02 — L’Afrique francophone reste à la marge",
          paragraphs: [
            "Faute d’espaces structurés, les juristes africains francophones manquent encore de leviers collectifs pour analyser ces transformations, contribuer aux cadres réglementaires et peser sur les normes émergentes.",
            "Ces mutations appellent une montée en compétence rapide, mais aussi une capacité collective à produire des positions adaptées aux réalités juridiques, économiques et sociales africaines.",
          ],
        },
      ],
    },
    {
      heading: "02 — Notre ambition",
      subtitle: "Une plateforme de référence au service de l’expertise africaine.",
      paragraphs: [
        "Au-delà d’un simple réseau, ALIN se positionne comme un acteur de réflexion et d’influence. Notre ambition est de structurer une expertise juridique africaine visible, ancrée dans les réalités locales et reconnue dans les espaces internationaux.",
        "Nous croyons qu’il n’y aura pas de souveraineté numérique africaine sans souveraineté juridique. Et qu’il n’y aura pas de souveraineté juridique sans une communauté organisée, formée et engagée capable de porter la voix du continent dans la fabrique des normes.",
      ],
    },
    {
      heading: "Nos quatre missions",
      subtitle: "Faire de l’Afrique un contributeur à part entière.",
      numbered: [
        {
          label: "01 — Structurer une communauté engagée",
          body: "Réunir les juristes africains mobilisés sur les enjeux d’innovation juridique et d’intelligence artificielle, à travers un réseau actif, exigeant et tourné vers l’action collective.",
        },
        {
          label: "02 — Développer l’analyse et la formation",
          body: "Bâtir des capacités d’analyse et des programmes de formation adaptés aux systèmes juridiques locaux, aux réalités OHADA-CEMAC et aux besoins concrets des praticiens du continent.",
        },
        {
          label: "03 — Contribuer aux cadres réglementaires",
          body: "Produire des contributions juridiques substantielles sur les cadres réglementaires émergents en matière d’IA, de gouvernance des données et de transformation numérique.",
        },
        {
          label: "04 — Faire émerger une expertise visible",
          body: "Favoriser l’émergence d’une expertise africaine capable d’accompagner les évolutions du métier et de prendre place dans les espaces internationaux où s’élaborent les normes globales.",
        },
      ],
    },
    {
      heading: "Les quatre axes structurants",
      subtitle: "Le cadre d’action d’ALIN.",
      axes: [
        {
          label: "Axe 01 — Innovation juridique & technologique",
          body: "Outils, plateformes et démarches d’innovation au service du droit africain. Documentation et valorisation du droit OHADA-CEMAC comme ressource exploitable.",
        },
        {
          label: "Axe 02 — Gouvernance des données & politique publique",
          body: "Plaidoyer pour une souveraineté numérique africaine. Contributions aux cadres réglementaires sur l’IA et les données dans l’espace francophone.",
        },
        {
          label: "Axe 03 — Leadership, formation & impact",
          body: "Renforcement des capacités des juristes africains face aux transformations technologiques. Programmes de formation, mentorat et mise en réseau des talents.",
        },
        {
          label: "Axe 04 — Transformation & avenir du droit",
          body: "Recherche prospective sur l’évolution des professions juridiques en Afrique. Dialogue entre praticiens, académiques, institutions et société civile.",
        },
      ],
    },
    {
      heading: "Rejoindre ALIN",
      paragraphs: [
        "Choisir de ne pas subir ces transformations, mais d’y prendre part activement.",
      ],
      joinList: [
        {
          term: "Suivre la dynamique",
          detail: "rester informé·e des publications, événements et prises de position d’ALIN.",
        },
        {
          term: "Rejoindre le réseau",
          detail: "intégrer la communauté de juristes engagés sur l’innovation et l’IA.",
        },
        {
          term: "Contribuer aux réflexions",
          detail: "participer aux travaux, groupes thématiques et productions du réseau.",
        },
      ],
    },
  ],
  quote: {
    line1: "Le droit de demain se construit aujourd’hui.",
    line2: "Il doit se construire ici.",
  },
  footerName: "African Legal Innovation Network",
  footerPlace: "Libreville · 2026",
};

const en: Manifesto = {
  eyebrow: "Our position",
  title: "Manifesto",
  accent: "Asserting African legal expertise.",
  lede: "A public affirmation of our vision: an African law conceived, written and equipped by African legal professionals, in the age of artificial intelligence.",
  launch: "Official launch · Libreville, 16 April 2026 · Forum Cyber’Elles",
  sections: [
    {
      heading: "Why ALIN exists",
      paragraphs: [
        "The legal professions are undergoing a profound transformation. Legal research, contract drafting, litigation, compliance, governance — artificial intelligence is already reshaping practices and redefining the skills expected of legal professionals.",
        "ALIN was created to assert the voice of French-speaking African legal professionals in this transformation, and to make Africa a full-fledged contributor in shaping the standards of artificial intelligence.",
      ],
    },
    {
      heading: "01 — The dual observation",
      subtitle: "A global transformation. An African absence.",
      paragraphs: [
        "While the normative frameworks of artificial intelligence are taking shape on a global scale, the French-speaking African space remains largely under-represented in international governance dynamics.",
        "This absence is not trivial. It weakens the ability of African legal professionals to anticipate, influence and govern the developments that will structure their profession and their economies for the decades to come.",
      ],
      subsections: [
        {
          heading: "Observation 01 — AI is transforming the legal professions",
          paragraphs: [
            "The rise of artificial intelligence is profoundly redefining the expected skills, professional practices and economic models of law firms and legal departments.",
          ],
        },
        {
          heading: "Observation 02 — French-speaking Africa remains on the margins",
          paragraphs: [
            "For lack of structured spaces, French-speaking African legal professionals still lack the collective levers to analyse these transformations, contribute to regulatory frameworks and influence emerging standards.",
            "These changes call for rapid upskilling, but also for a collective capacity to produce positions adapted to African legal, economic and social realities.",
          ],
        },
      ],
    },
    {
      heading: "02 — Our ambition",
      subtitle: "A reference platform serving African expertise.",
      paragraphs: [
        "Beyond a simple network, ALIN positions itself as an actor of reflection and influence. Our ambition is to structure a visible African legal expertise, rooted in local realities and recognised in international arenas.",
        "We believe there will be no African digital sovereignty without legal sovereignty. And that there will be no legal sovereignty without an organised, trained and engaged community capable of carrying the continent’s voice in the making of standards.",
      ],
    },
    {
      heading: "Our four missions",
      subtitle: "Making Africa a full-fledged contributor.",
      numbered: [
        {
          label: "01 — Structure an engaged community",
          body: "Bring together African legal professionals mobilised around the challenges of legal innovation and artificial intelligence, through an active, demanding network geared towards collective action.",
        },
        {
          label: "02 — Develop analysis and training",
          body: "Build analytical capacities and training programmes adapted to local legal systems, to OHADA-CEMAC realities and to the concrete needs of the continent’s practitioners.",
        },
        {
          label: "03 — Contribute to regulatory frameworks",
          body: "Produce substantial legal contributions on the emerging regulatory frameworks relating to AI, data governance and digital transformation.",
        },
        {
          label: "04 — Bring forth a visible expertise",
          body: "Foster the emergence of an African expertise capable of supporting the evolution of the profession and taking its place in the international arenas where global standards are developed.",
        },
      ],
    },
    {
      heading: "The four structuring pillars",
      subtitle: "ALIN’s framework for action.",
      axes: [
        {
          label: "Pillar 01 — Legal & technological innovation",
          body: "Tools, platforms and innovation approaches serving African law. Documentation and valorisation of OHADA-CEMAC law as a usable resource.",
        },
        {
          label: "Pillar 02 — Data governance & public policy",
          body: "Advocacy for African digital sovereignty. Contributions to regulatory frameworks on AI and data in the French-speaking space.",
        },
        {
          label: "Pillar 03 — Leadership, training & impact",
          body: "Strengthening the capacities of African legal professionals in the face of technological transformations. Training programmes, mentoring and talent networking.",
        },
        {
          label: "Pillar 04 — Transformation & the future of law",
          body: "Forward-looking research on the evolution of the legal professions in Africa. Dialogue between practitioners, academics, institutions and civil society.",
        },
      ],
    },
    {
      heading: "Join ALIN",
      paragraphs: [
        "Choosing not to endure these transformations, but to take an active part in them.",
      ],
      joinList: [
        {
          term: "Follow the momentum",
          detail: "stay informed of ALIN’s publications, events and positions.",
        },
        {
          term: "Join the network",
          detail: "become part of the community of legal professionals engaged on innovation and AI.",
        },
        {
          term: "Contribute to the thinking",
          detail: "take part in the network’s work, thematic groups and outputs.",
        },
      ],
    },
  ],
  quote: {
    line1: "The law of tomorrow is built today.",
    line2: "It must be built here.",
  },
  footerName: "African Legal Innovation Network",
  footerPlace: "Libreville · 2026",
};

export function getManifesto(locale: string): Manifesto {
  return locale === "en" ? en : fr;
}
