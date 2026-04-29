import { SOCIAL_LINKS, type SocialPlatform } from "@/data/socials";

function SocialIcon({ icon }: { icon: SocialPlatform }) {
  switch (icon) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.08V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21h-4V9Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.92L6.06 22H3l7.25-8.29L1 2h6.25l4.32 6.27L18.9 2Zm-1.07 18h1.69L6.34 3.9H4.52L17.83 20Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5Zm9.38 1.12a1.13 1.13 0 1 1 0 2.26 1.13 1.13 0 0 1 0-2.26ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M21.58 7.2a2.86 2.86 0 0 0-2.01-2.02C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.57.48A2.86 2.86 0 0 0 2.42 7.2C1.93 8.97 1.93 12 1.93 12s0 3.03.49 4.8a2.86 2.86 0 0 0 2.01 2.02c1.77.48 7.57.48 7.57.48s5.8 0 7.57-.48a2.86 2.86 0 0 0 2.01-2.02c.49-1.77.49-4.8.49-4.8s0-3.03-.49-4.8ZM10.2 15.02V8.98L15.5 12l-5.3 3.02Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.87.25-1.46 1.5-1.46h1.6V3.96A21.2 21.2 0 0 0 14.2 3c-2.4 0-4.04 1.46-4.04 4.14V10H7.5v3h2.66v8h3.34Z" />
        </svg>
      );
  }
}

type SocialLinksProps = {
  className?: string;
};

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div className={className}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Suivez-nous sur ${social.name}`}
          className="surface-muted inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
        >
          <SocialIcon icon={social.icon} />
        </a>
      ))}
    </div>
  );
}
