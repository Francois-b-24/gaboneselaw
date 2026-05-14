const ITEMS = [
  {
    title: "IA et responsabilité juridique",
    text: "Comprendre qui est responsable en cas d’erreur d’un système d’IA et comment documenter les décisions.",
    level: "Lecture 6 min",
  },
  {
    title: "Protection des données personnelles",
    text: "Bonnes pratiques pour traiter des données conformément au cadre légal et limiter les risques de non-conformité.",
    level: "Lecture 7 min",
  },
  {
    title: "Automatisation et droit du travail",
    text: "Impacts potentiels de l’IA sur l’emploi, le contrôle des salariés et les obligations de l’employeur.",
    level: "Lecture 8 min",
  },
  {
    title: "Contrats numériques",
    text: "Clauses essentielles pour sécuriser une prestation digitale, une licence logicielle ou un usage d’IA.",
    level: "Lecture 5 min",
  },
  {
    title: "Preuve et traçabilité",
    text: "Comment conserver des éléments probants dans un environnement numérique (emails, logs, versions, signatures).",
    level: "Lecture 6 min",
  },
  {
    title: "Conformité opérationnelle",
    text: "Mettre en place un socle simple : politiques internes, registres, gouvernance minimale et revue périodique.",
    level: "Lecture 9 min",
  },
];

export default function RessourcesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Ressources pédagogiques</h1>
      <p className="text-muted mt-3 max-w-3xl">
        Cette section propose des contenus de vulgarisation sur l&apos;IA et le droit,
        avec un focus sur les enjeux pratiques pour les citoyens et les PME.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <article
            key={item.title}
            className="surface rounded-xl p-5"
          >
            <h2 className="text-lg font-medium">{item.title}</h2>
            <p className="text-muted mt-2 text-sm">{item.text}</p>
            <p className="mt-3 text-xs text-[color:var(--primary)]">{item.level}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
