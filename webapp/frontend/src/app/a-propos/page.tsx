import Image from "next/image";
import { LinkedInIcon } from "@/components/linkedin-icon";
import { Eyebrow } from "@/components/ui/eyebrow";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/f%C3%A9licia-ombanda-indoumou-4b265392/";

export default function AProposPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      {/* Hero court */}
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>Le réseau</Eyebrow>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          À propos
          <em className="accent-italic mt-2 block text-4xl md:text-5xl">
            un réseau panafricain d&apos;innovation juridique.
          </em>
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-12 py-20 md:grid-cols-5 md:gap-16">
        {/* Portrait */}
        <div className="md:col-span-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden border border-border-soft md:mx-0 md:max-w-none">
            <Image
              src="/felicia-ombanda-indoumou.png"
              alt="Portrait de Félicia Ombanda Indoumou, fondatrice d'ALIN"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 320px, 40vw"
              priority
            />
          </div>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Profil LinkedIn de Félicia Ombanda Indoumou (ouvre un nouvel onglet)"
            className="mt-6 inline-flex items-center gap-3 text-sm text-muted transition-colors hover:text-terra"
          >
            <LinkedInIcon className="h-5 w-5" />
            <span>
              Félicia Ombanda Indoumou <span aria-hidden>↗</span>
            </span>
          </a>
        </div>

        {/* Texte éditorial */}
        <div className="md:col-span-3">
          <p className="text-lg leading-[1.8] text-ink/85">
            <span className="font-serif text-ink">
              ALIN — African Legal Innovation Network
            </span>{" "}
            est un réseau panafricain d&apos;innovation juridique qui naît à
            partir d&apos;un double constat :
          </p>
          <ul className="mt-6 space-y-4">
            <li className="text-lg leading-[1.8] text-ink/85">
              <span className="hexagram" />
              l&apos;intelligence artificielle redéfinit en profondeur les
              compétences et les modèles des professionnels du droit ;
            </li>
            <li className="text-lg leading-[1.8] text-ink/85">
              <span className="hexagram" />
              et l&apos;Afrique francophone reste encore à la marge des espaces
              où ces transformations se pensent et se régulent.
            </li>
          </ul>
          <p className="mt-8 text-lg leading-[1.8] text-ink/85">
            Fondé par{" "}
            <span className="font-serif text-ink">
              Félicia Ombanda Indoumou
            </span>
            , Conseil juridique et fiscal agréée CEMAC, forte de plus de 13 ans
            d&apos;expérience en droit des affaires OHADA et en conseil fiscal,
            ALIN est le réseau dédié à l&apos;innovation juridique et
            technologique dans l&apos;espace francophone, pour que les juristes
            africains ne subissent pas les mutations liées à la montée en
            puissance de l&apos;intelligence artificielle, mais y prennent part
            activement.
          </p>
        </div>
      </section>
    </main>
  );
}
