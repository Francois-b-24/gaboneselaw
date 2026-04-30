export type SocialPlatform = "linkedin";

export type SocialLink = {
  name: string;
  url: string;
  icon: SocialPlatform;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/alin-african-legal-innovation-network", icon: "linkedin" },
];
