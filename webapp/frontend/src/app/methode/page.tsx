const STEPS = [
  {
    title: "1. Cadrage",
    text: "Qualification de la demande et identification du périmètre juridique gabonais.",
  },
  {
    title: "2. Recherche",
    text: "Extraction de sources pertinentes, tri par domaine et niveau de confiance.",
  },
  {
    title: "3. Restitution",
    text: "Réponse pédagogique, structurée et facilement réutilisable dans un dossier.",
  },
];

export default function MethodePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Méthode</h1>
      <p className="text-muted mt-3 max-w-3xl">
        Cette section documente la méthode opérationnelle. Chaque bloc peut être
        enrichi avec des textes métier, des captures, des procédures PDF et des vidéos.
      </p>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.title} className="surface rounded-xl p-5">
            <h2 className="text-lg font-medium">{step.title}</h2>
            <p className="text-muted mt-2 text-sm leading-relaxed">{step.text}</p>
          </article>
        ))}
      </section>

      <section className="surface mt-6 rounded-xl p-5">
        <h2 className="text-lg font-medium">Modèle de procédure (PDF)</h2>
        <p className="text-muted mt-2 text-sm">
          Exemple de support procédural pouvant être remplacé par les documents du client.
        </p>
        <a
          href="https://www.africau.edu/images/default/sample.pdf"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          Ouvrir le PDF de procédure
        </a>
      </section>
    </main>
  );
}
