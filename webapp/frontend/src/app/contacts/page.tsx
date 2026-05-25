import { ContactForm } from "@/components/contact-form";
import { SocialLinks } from "@/components/social-links";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionTitle } from "@/components/ui/section-title";

export default function ContactsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>Nous joindre</Eyebrow>
        <SectionTitle accent="ou une question institutionnelle." size="lg">
          Une démonstration, un partenariat,
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          Pour toute question sur le réseau, les contenus pédagogiques, ou pour
          proposer une source juridique officielle, notre équipe reste
          disponible.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-16 py-20 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <aside className="lg:col-span-2">
          <p className="eyebrow mb-6">Suivez-nous</p>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted">
            Retrouvez nos actualités et nos contenus pédagogiques sur nos
            réseaux.
          </p>
          <SocialLinks className="mt-6 flex flex-wrap gap-3" />
        </aside>
      </div>
    </main>
  );
}
