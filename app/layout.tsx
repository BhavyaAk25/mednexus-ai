import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "MedNexus AI | Patient Record Intelligence", template: "%s | MedNexus AI" },
  description: "Review outpatient records and trace each finding to its source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
