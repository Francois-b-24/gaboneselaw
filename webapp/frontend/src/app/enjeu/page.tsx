const PDF_RESOURCES = [
  {
    title: "Cadre général IA et droit (PDF)",
    href: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    title: "Note de cadrage gouvernance juridique (PDF)",
    href: "https://www.africau.edu/images/default/sample.pdf",
  },
];

export default function EnjeuPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Enjeu</h1>
      <p className="text-muted mt-3 max-w-3xl">
        Cette page centralise les contenus à destination du client final: documents,
        analyses, vidéos et synthèses. Les blocs ci-dessous sont conçus pour être
        facilement modifiables.
      </p>

      <section className="surface mt-6 rounded-xl p-5">
        <h2 className="text-lg font-medium">Contexte</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          L&apos;enjeu principal est d&apos;améliorer l&apos;accès au droit en gardant
          une restitution claire, traçable et exploitable par des profils variés
          (citoyens, équipes juridiques, partenaires projet).
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="surface rounded-xl p-5">
          <h2 className="text-lg font-medium">Documents PDF</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {PDF_RESOURCES.map((doc) => (
              <li key={doc.href}>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline-offset-4 hover:underline"
                >
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface rounded-xl p-5">
          <h2 className="text-lg font-medium">Vidéo explicative</h2>
          <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
            <iframe
              title="Enjeu projet ALIN"
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allowFullScreen
            />
          </div>
        </article>
      </section>
    </main>
  );
}
