import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrappers localisés de next/navigation : Link, useRouter, usePathname, redirect.
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
