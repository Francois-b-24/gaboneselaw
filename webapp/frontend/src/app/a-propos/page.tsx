import Image from "next/image";
import { LinkedInIcon } from "@/components/linkedin-icon";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/f%C3%A9licia-ombanda-indoumou-4b265392/";

export default function AProposPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-4xl flex-col px-3 py-10 sm:px-4 sm:py-12">
      <header className="mb-10">
        <p className="text-muted text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm">
          African Legal Innovation Network
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          À propos
        </h1>
      </header>

      <div className="mb-10 flex flex-1 flex-col gap-8 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-square w-40 shrink-0 overflow-hidden rounded-xl border sm:mx-0 sm:w-44">
          <Image
            src="/felicia-ombanda-indoumou.png"
            alt="Portrait de Félicia Ombanda Indoumou, fondatrice d'ALIN"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 160px, 176px"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 space-y-5 text-[color:var(--foreground)]">
          <p className="max-w-[72ch] text-base leading-8">
            <strong>ALIN — African Legal Innovation Network</strong>
            <span className="whitespace-pre"> </span>
            est un réseau panafricain d&apos;innovation juridique qui naît à partir
            d&apos;un double constat :
          </p>
          <ul className="max-w-[72ch] list-disc space-y-2 pl-5 text-base leading-8">
            <li>
              l&apos;intelligence artificielle redéfinit en profondeur les
              compétences et les modèles des professionnels du droit ;
            </li>
            <li>
              et l&apos;Afrique francophone reste encore à la marge des espaces
              où ces transformations se pensent et se régulent.
            </li>
          </ul>
          <p className="max-w-[72ch] text-base leading-8">
            Fondé par <strong>Félicia OMBANDA INDOUMOU</strong>, Conseil
            juridique et fiscal agréée CEMAC, forte de plus de 13 ans
            d&apos;expérience en droit des affaires OHADA et en conseil fiscal,
            ALIN est le réseau dédié à l&apos;innovation juridique et
            technologique dans l&apos;espace francophone, pour que les juristes
            africains ne subissent pas les mutations liées à la montée en
            puissance de l&apos;intelligence artificielle, mais y prennent part
            activement.
          </p>
        </div>
      </div>

      <footer className="mt-auto flex justify-center border-t pt-8 pb-2">
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Profil LinkedIn de Félicia Ombanda Indoumou"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
          style={{ borderColor: "var(--border)" }}
        >
          <LinkedInIcon className="h-6 w-6" />
        </a>
      </footer>
    </main>
  );
}
