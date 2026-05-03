import { ContactForm } from "@/components/contact-form";
import { SocialLinks } from "@/components/social-links";

export default function ContactsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-10 sm:px-4 sm:py-12">
      <h1 className="text-2xl font-semibold sm:text-3xl">Contact</h1>
      <p className="text-muted mt-4">
        Pour toute question sur le projet, les contenus pédagogiques, ou pour
        proposer une source juridique officielle, vous pouvez nous contacter.
      </p>
      <ContactForm />
      <section className="surface mt-6 rounded-xl p-5">
        <h2 className="text-lg font-medium">Suivez-nous</h2>
        <p className="text-muted mt-2 text-sm">
          Retrouvez nos actualités et nos contenus pédagogiques sur nos réseaux.
        </p>
        <SocialLinks className="mt-4 flex flex-wrap gap-3 text-[color:var(--foreground)]" />
      </section>
    </main>
  );
}
