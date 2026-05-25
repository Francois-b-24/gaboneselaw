import { Eyebrow } from "@/components/ui/eyebrow";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionTitle } from "@/components/ui/section-title";

const ITEMS = [
  {
    title: "IA et responsabilité juridique",
    text: "Comprendre qui est responsable en cas d'erreur d'un système d'IA et comment documenter les décisions.",
    level: "Lecture 6 min",
  },
  {
    title: "Protection des données personnelles",
    text: "Bonnes pratiques pour traiter des données conformément au cadre légal et limiter les risques de non-conformité.",
    level: "Lecture 7 min",
  },
  {
    title: "Automatisation et droit du travail",
    text: "Impacts potentiels de l'IA sur l'emploi, le contrôle des salariés et les obligations de l'employeur.",
    level: "Lecture 8 min",
  },
  {
    title: "Contrats numériques",
    text: "Clauses essentielles pour sécuriser une prestation digitale, une licence logicielle ou un usage d'IA.",
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
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>Ressources pédagogiques</Eyebrow>
        <SectionTitle accent="pour les citoyens et les PME." size="xl">
          Vulgariser l&apos;IA et le droit,
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          Des contenus de vulgarisation sur l&apos;IA et le droit, avec un focus
          sur les enjeux pratiques pour les citoyens et les entreprises.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-12 py-20 md:grid-cols-3">
        {ITEMS.map((item) => (
          <FeatureCard
            key={item.title}
            title={item.title}
            description={item.text}
            tags={[item.level]}
          />
        ))}
      </section>
    </main>
  );
}
