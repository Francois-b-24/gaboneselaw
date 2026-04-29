export default function ManifestePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-10 sm:px-4 sm:py-12">
      <header className="mb-8">
        <p className="text-muted text-sm tracking-wide uppercase">Projet citoyen</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Manifeste</h1>
        <p className="text-muted mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
          Rendre le droit gabonais compréhensible n&apos;est pas un luxe: c&apos;est une
          condition d&apos;autonomie, de confiance et de justice au quotidien.
        </p>
      </header>

      <section className="space-y-5 text-[color:var(--foreground)]">
        <p className="max-w-[72ch] text-base leading-8">
          Trop souvent, l&apos;information juridique reste difficile d&apos;accès pour les
          citoyens: textes dispersés, vocabulaire technique, procédures perçues
          comme opaques. Beaucoup renoncent avant même de commencer leurs
          démarches, non par manque d&apos;intérêt, mais parce que le point d&apos;entrée
          semble trop complexe.
        </p>

        <p className="max-w-[72ch] text-base leading-8">
          Cette situation nourrit des incompréhensions, ralentit les décisions et
          fragilise la capacité de chacun à exercer ses droits. Quand l&apos;accès au
          droit devient un parcours d&apos;obstacles, l&apos;écart se creuse entre la règle
          et son application concrète dans la vie des personnes, des familles et
          des petites organisations.
        </p>

        <blockquote className="surface max-w-[72ch] rounded-xl border-l-4 p-5 italic leading-8 text-[color:var(--foreground)]">
          Notre conviction est simple: l&apos;innovation doit servir la clarté. Une
          technologie bien conçue peut transformer la complexité juridique en
          repères concrets, sans trahir la rigueur des sources.
        </blockquote>

        <p className="max-w-[72ch] text-base leading-8">
          Nous croyons qu&apos;il est possible de bâtir des outils qui expliquent sans
          simplifier à l&apos;excès, qui accompagnent sans remplacer les professionnels
          du droit, et qui renforcent la capacité d&apos;agir de chaque utilisateur.
          L&apos;innovation n&apos;a de sens que si elle reste utile, lisible et responsable.
        </p>

        <p className="max-w-[72ch] text-base leading-8">
          C&apos;est l&apos;engagement de ce projet: proposer des contenus pédagogiques en
          français, structurer les réponses autour de sources identifiables, et
          maintenir une posture de transparence sur les limites de l&apos;assistant. À
          chaque étape, la priorité est la même: permettre à davantage de citoyens
          de comprendre leurs options juridiques avec confiance.
        </p>

        <p className="max-w-[72ch] text-base leading-8">
          Ce manifeste est une promesse de continuité: améliorer l&apos;accès au droit
          gabonais par des outils concrets, ouverts à l&apos;évolution des besoins, et
          guidés par l&apos;intérêt général. Parce qu&apos;un droit compris est un droit qui
          peut réellement être exercé.
        </p>
      </section>
    </main>
  );
}
