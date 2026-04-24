export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="text-muted mt-4">
        Pour toute question sur le projet, les contenus pédagogiques, ou pour
        proposer une source juridique officielle, vous pouvez nous contacter.
      </p>
      <div className="surface mt-6 rounded-xl p-5">
        <p className="text-sm">
          Email: <span className="font-medium">contact@infojuridique.ga</span>
        </p>
        <p className="mt-2 text-sm">
          Note : ce canal ne remplace pas une consultation juridique.
        </p>
      </div>
    </main>
  );
}
