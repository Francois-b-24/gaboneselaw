import { Eyebrow } from "@/components/ui/eyebrow";

/** Séparateur de section — glyphe ALIN ❖ (distinct du ◇ LexGabon). */
function Divider() {
  return (
    <p className="my-16 text-center text-2xl text-terra/60" aria-hidden>
      ❖
    </p>
  );
}

export default function ManifestePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      {/* Hero court */}
      <header className="border-b border-border-soft pb-20">
        <Eyebrow>Notre position</Eyebrow>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          Manifeste
          <em className="accent-italic mt-2 block text-4xl md:text-5xl">
            Affirmer l&apos;expertise juridique africaine.
          </em>
        </h1>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          Une affirmation publique de notre vision : un droit africain pensé,
          écrit et outillé par des juristes africains, à l&apos;ère de
          l&apos;intelligence artificielle.
        </p>
        <p className="eyebrow mt-8">
          Lancement officiel · Libreville, 16 avril 2026 · Forum Cyber&apos;Elles
        </p>
      </header>

      {/* Corps long-form */}
      <article className="prose-editorial py-24">
        <h2>Pourquoi ALIN existe</h2>
        <p>
          Les métiers du droit traversent une mutation profonde. Recherche
          juridique, rédaction contractuelle, contentieux, conformité,
          gouvernance — l&apos;intelligence artificielle transforme déjà les
          pratiques et redéfinit les compétences attendues des professionnels du
          droit.
        </p>
        <p>
          ALIN est née pour affirmer la voix des juristes africains francophones
          dans cette transformation, et pour faire de l&apos;Afrique un
          contributeur à part entière dans la construction des normes de
          l&apos;intelligence artificielle.
        </p>

        <Divider />

        <h2>01 — Le double constat</h2>
        <p className="eyebrow !text-sm">
          Une transformation mondiale. Une absence africaine.
        </p>
        <p>
          Pendant que les cadres normatifs de l&apos;intelligence artificielle se
          dessinent à l&apos;échelle mondiale, l&apos;espace africain francophone
          demeure largement sous-représenté dans les dynamiques internationales
          de gouvernance.
        </p>
        <p>
          Cette absence n&apos;est pas anodine. Elle fragilise la capacité des
          juristes africains à anticiper, influencer et encadrer les évolutions
          qui structureront leur profession et leurs économies pour les décennies
          à venir.
        </p>

        <h3>Constat 01 — L&apos;IA mute les professions juridiques</h3>
        <p>
          La montée en puissance de l&apos;intelligence artificielle redéfinit en
          profondeur les compétences attendues, les pratiques professionnelles et
          les modèles économiques des cabinets et directions juridiques.
        </p>

        <h3>Constat 02 — L&apos;Afrique francophone reste à la marge</h3>
        <p>
          Faute d&apos;espaces structurés, les juristes africains francophones
          manquent encore de leviers collectifs pour analyser ces transformations,
          contribuer aux cadres réglementaires et peser sur les normes émergentes.
        </p>
        <p>
          Ces mutations appellent une montée en compétence rapide, mais aussi une
          capacité collective à produire des positions adaptées aux réalités
          juridiques, économiques et sociales africaines.
        </p>

        <Divider />

        <h2>02 — Notre ambition</h2>
        <p className="eyebrow !text-sm">
          Une plateforme de référence au service de l&apos;expertise africaine.
        </p>
        <p>
          Au-delà d&apos;un simple réseau, ALIN se positionne comme un acteur de
          réflexion et d&apos;influence. Notre ambition est de structurer une
          expertise juridique africaine visible, ancrée dans les réalités locales
          et reconnue dans les espaces internationaux.
        </p>
        <p>
          Nous croyons qu&apos;il n&apos;y aura pas de souveraineté numérique
          africaine sans souveraineté juridique. Et qu&apos;il n&apos;y aura pas de
          souveraineté juridique sans une communauté organisée, formée et engagée
          capable de porter la voix du continent dans la fabrique des normes.
        </p>

        <Divider />

        <h2>Nos quatre missions</h2>
        <p className="eyebrow !text-sm">
          Faire de l&apos;Afrique un contributeur à part entière.
        </p>
        <ol className="mt-8 space-y-8 border-t border-border-soft pt-8">
          <li>
            <p className="eyebrow mb-2">01 — Structurer une communauté engagée</p>
            <p>
              Réunir les juristes africains mobilisés sur les enjeux
              d&apos;innovation juridique et d&apos;intelligence artificielle, à
              travers un réseau actif, exigeant et tourné vers l&apos;action
              collective.
            </p>
          </li>
          <li>
            <p className="eyebrow mb-2">
              02 — Développer l&apos;analyse et la formation
            </p>
            <p>
              Bâtir des capacités d&apos;analyse et des programmes de formation
              adaptés aux systèmes juridiques locaux, aux réalités OHADA-CEMAC et
              aux besoins concrets des praticiens du continent.
            </p>
          </li>
          <li>
            <p className="eyebrow mb-2">
              03 — Contribuer aux cadres réglementaires
            </p>
            <p>
              Produire des contributions juridiques substantielles sur les cadres
              réglementaires émergents en matière d&apos;IA, de gouvernance des
              données et de transformation numérique.
            </p>
          </li>
          <li>
            <p className="eyebrow mb-2">
              04 — Faire émerger une expertise visible
            </p>
            <p>
              Favoriser l&apos;émergence d&apos;une expertise africaine capable
              d&apos;accompagner les évolutions du métier et de prendre place dans
              les espaces internationaux où s&apos;élaborent les normes globales.
            </p>
          </li>
        </ol>

        <Divider />

        <h2>Les quatre axes structurants</h2>
        <p className="eyebrow !text-sm">Le cadre d&apos;action d&apos;ALIN.</p>
        <ul className="mt-8 space-y-8 border-t border-border-soft pt-8">
          <li>
            <p className="font-serif text-xl text-ink">
              Axe 01 — Innovation juridique &amp; technologique
            </p>
            <p className="mt-2">
              Outils, plateformes et démarches d&apos;innovation au service du
              droit africain. Documentation et valorisation du droit OHADA-CEMAC
              comme ressource exploitable.
            </p>
          </li>
          <li>
            <p className="font-serif text-xl text-ink">
              Axe 02 — Gouvernance des données &amp; politique publique
            </p>
            <p className="mt-2">
              Plaidoyer pour une souveraineté numérique africaine. Contributions
              aux cadres réglementaires sur l&apos;IA et les données dans
              l&apos;espace francophone.
            </p>
          </li>
          <li>
            <p className="font-serif text-xl text-ink">
              Axe 03 — Leadership, formation &amp; impact
            </p>
            <p className="mt-2">
              Renforcement des capacités des juristes africains face aux
              transformations technologiques. Programmes de formation, mentorat et
              mise en réseau des talents.
            </p>
          </li>
          <li>
            <p className="font-serif text-xl text-ink">
              Axe 04 — Transformation &amp; avenir du droit
            </p>
            <p className="mt-2">
              Recherche prospective sur l&apos;évolution des professions
              juridiques en Afrique. Dialogue entre praticiens, académiques,
              institutions et société civile.
            </p>
          </li>
        </ul>

        <Divider />

        <h2>Rejoindre ALIN</h2>
        <p>
          Choisir de ne pas subir ces transformations, mais d&apos;y prendre part
          activement.
        </p>
        <ul className="mt-6 space-y-4 border-t border-border-soft pt-6">
          <li className="text-lg leading-[1.8] text-ink/85">
            <span className="hexagram font-serif text-ink">Suivre la dynamique</span>{" "}
            — rester informé·e des publications, événements et prises de position
            d&apos;ALIN.
          </li>
          <li className="text-lg leading-[1.8] text-ink/85">
            <span className="hexagram font-serif text-ink">Rejoindre le réseau</span>{" "}
            — intégrer la communauté de juristes engagés sur l&apos;innovation et
            l&apos;IA.
          </li>
          <li className="text-lg leading-[1.8] text-ink/85">
            <span className="hexagram font-serif text-ink">
              Contribuer aux réflexions
            </span>{" "}
            — participer aux travaux, groupes thématiques et productions du réseau.
          </li>
        </ul>

        <blockquote className="mt-16 border-l-2 border-terra pl-8 font-serif text-2xl italic leading-relaxed text-ink md:text-3xl">
          Le droit de demain se construit aujourd&apos;hui.
          <span className="mt-2 block not-italic text-terra">
            Il doit se construire ici.
          </span>
        </blockquote>
      </article>

      <footer className="border-t border-border-soft py-16 text-center">
        <p className="font-serif text-xl text-ink">
          African Legal Innovation Network
        </p>
        <p className="eyebrow mt-3">Libreville · 2026</p>
      </footer>
    </main>
  );
}
