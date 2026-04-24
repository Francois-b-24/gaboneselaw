import Link from "next/link";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

export default function Home() {
  return (
    <main className="apple-scroll mx-auto w-full max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
      <RevealOnScroll
        id="accueil"
        className="apple-section surface rounded-2xl p-5 shadow-sm sm:p-8"
      >
        <p className="text-muted text-xs font-semibold uppercase tracking-wide">
          ALIN - African Legal Innovation Network
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          La transformation du Droit africain,
          <br />
          pensée pour <span className="title-emphasis">durer.</span>
        </h1>
        <p className="text-muted mt-4 max-w-3xl text-base leading-relaxed">
          ALIN vulgarise les impacts de l&apos;IA sur les pratiques juridiques et
          propose un assistant spécialisé en droit gabonais, fondé sur des sources
          documentaires vérifiables.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/chatbot"
            className="btn-primary rounded-md px-4 py-2 text-sm"
          >
            Ouvrir le chatbot
          </Link>
          <Link
            href="/ressources"
            className="btn-secondary rounded-md px-4 py-2 text-sm"
          >
            Voir les ressources
          </Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="surface-muted rounded-lg p-3">
            <p className="text-xs text-amber-300">Couverture</p>
            <p className="mt-1 text-sm">Droit gabonais uniquement</p>
          </div>
          <div className="surface-muted rounded-lg p-3">
            <p className="text-xs text-amber-300">Méthode</p>
            <p className="mt-1 text-sm">RAG + citations de sources</p>
          </div>
          <div className="surface-muted rounded-lg p-3">
            <p className="text-xs text-amber-300">Livrables</p>
            <p className="mt-1 text-sm">Réponse, synthèse, rapport PDF</p>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        id="enjeu"
        className="apple-section mt-10"
        delayMs={40}
      >
        <p className="section-kicker">L&apos;enjeu</p>
        <h2 className="section-title mt-2">
          Rendre le droit plus accessible,
          <br />
          sans perdre en <span className="title-emphasis">rigueur.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="surface mt-4 rounded-2xl p-6">
          <p className="text-muted leading-relaxed">
            Les enjeux juridiques liés à l&apos;IA évoluent vite. ALIN aide les
            citoyens, étudiants et professionnels à comprendre les règles applicables
            avec une approche claire, pédagogique et structurée.
          </p>
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="apple-section mt-10" delayMs={60}>
        <p className="section-kicker">Votre problème</p>
        <h2 className="section-title mt-2">
          Une question juridique complexe,
          <br />
          une réponse <span className="title-emphasis">claire.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Je ne sais pas par où commencer",
              text: "Le chatbot reformule votre question et identifie le bon angle juridique.",
            },
            {
              title: "Je veux une réponse fiable",
              text: "Les réponses intègrent les sources documentaires et leurs citations.",
            },
            {
              title: "Je dois produire un document",
              text: "Vous pouvez générer une synthèse ou un rapport PDF en quelques clics.",
            },
          ].map((item) => (
            <article key={item.title} className="surface rounded-xl p-5">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        id="methode"
        className="apple-section mt-10"
        delayMs={80}
      >
        <p className="section-kicker">Notre méthode</p>
        <h2 className="section-title mt-2">
          Cadrer, vérifier, restituer.
          <br />
          Avec des sources <span className="title-emphasis">explicites.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="surface-muted mt-4 rounded-xl p-4">
          <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
            Le chatbot répond uniquement en droit gabonais. Il s&apos;appuie d&apos;abord
            sur la base documentaire indexée. Si celle-ci est insuffisante sur un point
            précis, il peut compléter avec les connaissances générales du modèle, en
            l&apos;indiquant clairement dans la réponse.
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Étape 1 · Cadrage gabonais",
              text: "Identification de la question et vérification qu'elle relève bien du droit gabonais.",
            },
            {
              title: "Étape 2 · Priorité aux documents",
              text: "Recherche d'extraits juridiques pertinents dans les sources indexées, avec citations.",
            },
            {
              title: "Étape 3 · Restitution transparente",
              text: "Réponse claire, avec indication explicite de la source utilisée (documents, connaissances générales, ou mixte).",
            },
          ].map((item) => (
            <article key={item.title} className="surface rounded-xl p-5">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        id="livrables"
        className="apple-section mt-10"
        delayMs={100}
      >
        <p className="section-kicker">Ce que vous obtenez</p>
        <h2 className="section-title mt-2">
          Plus qu&apos;une réponse.
          <br />
          Des livrables <span className="title-emphasis">exploitables.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="surface rounded-xl p-5">
            <h3 className="text-lg font-medium">Réponse juridique guidée</h3>
            <p className="text-muted mt-2 text-sm">
              Une réponse structurée, compréhensible, et adossée à des références
              de sources.
            </p>
          </article>
          <article className="surface rounded-xl p-5">
            <h3 className="text-lg font-medium">Livrables exploitables</h3>
            <p className="text-muted mt-2 text-sm">
              Synthèse des sources, rapport détaillé, et export PDF pour
              capitaliser les résultats.
            </p>
          </article>
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        id="a-propos"
        className="apple-section mt-10"
        delayMs={120}
      >
        <p className="section-kicker">Cas d&apos;usage</p>
        <h2 className="section-title mt-2">
          Entreprises, citoyens, praticiens.
          <br />
          Un assistant <span className="title-emphasis">utile.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Entreprises",
              text: "Comprendre les obligations juridiques liées au numérique, à la conformité et à la gestion des risques.",
            },
            {
              title: "Citoyens",
              text: "Obtenir des explications simples sur les démarches juridiques du quotidien en droit gabonais.",
            },
            {
              title: "Étudiants et praticiens",
              text: "Structurer une première analyse à partir de sources documentaires et de citations vérifiables.",
            },
          ].map((item) => (
            <article key={item.title} className="surface rounded-xl p-5">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="apple-section mt-10" delayMs={140}>
        <p className="section-kicker">Références</p>
        <h2 className="section-title mt-2">
          Une approche orientée sources.
          <br />
          Et totalement <span className="title-emphasis">traçable.</span>
        </h2>
        <div className="section-accent mt-3" />
        <div className="surface mt-4 rounded-2xl p-6">
          <h3 className="text-2xl font-semibold">
            Une approche orientée sources et traçabilité.
          </h3>
          <p className="text-muted mt-3 leading-relaxed">
            Chaque réponse est conçue pour rester lisible, professionnelle et
            fondée sur des documents identifiés. L&apos;objectif n&apos;est pas de
            remplacer un avocat, mais d&apos;apporter un socle fiable de compréhension
            juridique.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="surface-muted rounded-lg p-4">
              <p className="text-sm font-medium">Traçabilité</p>
              <p className="text-muted mt-1 text-sm">
                Sources juridiques citées dans le corps de la réponse.
              </p>
            </div>
            <div className="surface-muted rounded-lg p-4">
              <p className="text-sm font-medium">Restitution</p>
              <p className="text-muted mt-1 text-sm">
                Format structuré : réponse courte, analyse, démarches et limites.
              </p>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        className="apple-section surface mt-10 rounded-2xl p-6"
        delayMs={160}
      >
        <p className="section-kicker">Passer à l&apos;action</p>
        <h2 className="section-title mt-2">
          Posez votre question.
          <br />
          Obtenez une réponse <span className="title-emphasis">fondée.</span>
        </h2>
        <div className="section-accent mt-3" />
        <p className="text-muted mt-3 max-w-3xl">
          Le chatbot ALIN répond uniquement sur le droit gabonais et fournit des
          informations générales à visée pédagogique.
        </p>
        <div className="mt-5">
          <Link href="/chatbot" className="btn-primary rounded-md px-4 py-2 text-sm">
            Accéder au chatbot
          </Link>
        </div>
      </RevealOnScroll>

      <RevealOnScroll
        id="contact"
        className="apple-section surface mt-10 rounded-2xl p-6"
        delayMs={180}
      >
        <p className="section-kicker">Contact</p>
        <h2 className="section-title mt-2">
          Parlons de votre projet.
          <br />
          Construisons quelque chose de <span className="title-emphasis">solide.</span>
        </h2>
        <div className="section-accent mt-3" />
        <p className="text-muted mt-3 max-w-3xl">
          Contactez ALIN pour une démonstration, une question de partenariat ou
          l&apos;ajout de nouvelles sources documentaires.
        </p>
        <p className="mt-4 text-sm">Email : contact@alin-africa.org</p>
      </RevealOnScroll>
    </main>
  );
}
