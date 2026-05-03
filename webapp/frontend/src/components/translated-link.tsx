"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

export type TranslatedLinkProps = ComponentProps<typeof NextLink>;

function isInternalAppPath(href: TranslatedLinkProps["href"]): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

/**
 * Liens internes : toujours `<a>` natif (chargement document complet).
 * Sinon Next.js garde une navigation « App Router » et le HTML ne repasse pas
 * par Google Translate après le premier chargement.
 */
export function TranslatedLink({
  href,
  onClick,
  prefetch,
  replace,
  scroll,
  locale,
  ...rest
}: TranslatedLinkProps) {
  if (!isInternalAppPath(href)) {
    return (
      <NextLink
        href={href}
        onClick={onClick}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        locale={locale}
        {...rest}
      />
    );
  }

  return <a href={href} onClick={onClick} {...rest} />;
}
