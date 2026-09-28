import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

export const spaceGrotesk = Space_Grotesk({
  weight: "600",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const plexSans = IBM_Plex_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

export const fontVariables = `${spaceGrotesk.variable} ${plexSans.variable}`;
