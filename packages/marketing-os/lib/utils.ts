import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createMetadata(title: string, description: string) {
  return {
    title: `${title} | Aksh Health`,
    description,
    openGraph: {
      title: `${title} | Aksh Health`,
      description,
      siteName: "Aksh Health",
    },
  };
}
