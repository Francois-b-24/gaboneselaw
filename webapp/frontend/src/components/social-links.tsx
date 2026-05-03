import { LinkedInIcon } from "@/components/linkedin-icon";
import { SOCIAL_LINKS, type SocialPlatform } from "@/data/socials";

function SocialIcon({ icon }: { icon: SocialPlatform }) {
  switch (icon) {
    case "linkedin":
      return <LinkedInIcon className="h-5 w-5" />;
    default:
      return null;
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
