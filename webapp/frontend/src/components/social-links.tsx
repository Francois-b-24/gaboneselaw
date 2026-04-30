import { SOCIAL_LINKS, type SocialPlatform } from "@/data/socials";

function SocialIcon({ icon }: { icon: SocialPlatform }) {
  switch (icon) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.08V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21h-4V9Z" />
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
