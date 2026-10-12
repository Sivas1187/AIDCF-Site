import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { research } from "@/lib/data";

const description =
  "AIDCF traces an AI service outcome through the power, cooling, network, storage, control systems and suppliers it depends on, to evidence, non-compensating critical gates and an accountable, bounded assurance decision. Validation candidate for independent review.";

export const metadata: Metadata = {
  metadataBase: new URL("https://aidcf.org"),
  title: {
    default: `AIDCF: ${research.name}`,
    template: "%s · AIDCF",
  },
  description,
  applicationName: "AIDCF",
  authors: research.citation.authors.map((a) => ({ name: `${a.given} ${a.family}` })),
  openGraph: {
    type: "website",
    siteName: "AIDCF",
    title: `AIDCF: ${research.name}`,
    description,
    url: "https://aidcf.org/",
    locale: "en_GB",
  },
  twitter: { card: "summary", title: "AIDCF", description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
