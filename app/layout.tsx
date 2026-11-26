import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "MedNexus AI | Patient Record Intelligence", template: "%s | MedNexus AI" },
  description: "A source-linked patient record workspace for outpatient review. Explore the MedNexus AI course prototype using synthetic cases.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
