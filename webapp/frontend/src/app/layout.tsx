import type { ReactNode } from "react";
import "./globals.css";

// Le <html>/<body> et les providers vivent dans app/[locale]/layout.tsx,
// où la locale est connue. Ce layout racine reste un simple passe-plat.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
