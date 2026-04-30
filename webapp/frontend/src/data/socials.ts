export type SocialPlatform = "linkedin" | "x" | "instagram" | "youtube" | "facebook";

export type SocialLink = {
  name: string;
  url: string;
  icon: SocialPlatform;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/alin-african-legal-innovation-network", icon: "linkedin" },
  { name: "X", url: "https://x.com/your-handle", icon: "x" },
  { name: "Instagram", url: "https://www.instagram.com/your-handle", icon: "instagram" },
  { name: "YouTube", url: "https://www.youtube.com/@your-channel", icon: "youtube" },
  { name: "Facebook", url: "https://www.facebook.com/your-page", icon: "facebook" },
];
