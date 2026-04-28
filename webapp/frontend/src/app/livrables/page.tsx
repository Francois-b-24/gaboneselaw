const DELIVERABLES = [
  {
    title: "Réponse juridique guidée",
    text: "Réponse claire avec contextualisation et renvoi vers les éléments utiles.",
  },
  {
    title: "Synthèse thématique",
    text: "Résumé opérationnel des points clés pour briefing interne ou client.",
  },
  {
    title: "Rapport exportable",
    text: "Version structurée en PDF pour archivage, partage ou revue qualité.",
  },
];

export default function LivrablesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Livrables</h1>
      <p className="text-muted mt-3 max-w-3xl">
        Bibliothèque de livrables modulable: textes, ressources téléchargeables,
        supports vidéo et documents d&apos;accompagnement.
      </p>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {DELIVERABLES.map((item) => (
          <article key={item.title} className="surface rounded-xl p-5">
            <h2 className="text-lg font-medium">{item.title}</h2>
            <p className="text-muted mt-2 text-sm leading-relaxed">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="surface rounded-xl p-5">
          <h2 className="text-lg font-medium">Exemple de rapport PDF</h2>
          <a
            href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-blue-700 underline-offset-4 hover:underline"
          >
            Télécharger un exemple
          </a>
        </article>
        <article className="surface rounded-xl p-5">
          <h2 className="text-lg font-medium">Présentation vidéo</h2>
          <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
            <iframe
              title="Présentation livrables"
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/ysz5S6PUM-U"
              allowFullScreen
            />
          </div>
        </article>
      </section>
    </main>
  );
}
