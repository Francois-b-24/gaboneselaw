import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif éditorial — grammaire partagée avec LexGabon.
// Police variable : `axes` n'est permis que sans `weight` explicite (ou weight: "variable").
// NB: `opsz` est un axe par défaut de Fraunces ; ne pas le lister dans `axes` (erreur build).
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["SOFT"],
});

export const metadata: Metadata = {
  title: "ALIN - African Legal Innovation Network",
  description:
    "Vulgariser et connecter le droit africain : informations juridiques accessibles, fiables et ancrées dans les réalités du continent.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-[100dvh] flex-col overflow-x-hidden">
        <div
          id="google_translate_element"
          className="google-translate-hide"
          aria-hidden
        />
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
