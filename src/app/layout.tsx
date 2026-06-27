import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LanguageProvider } from "@/lib/i18n/provider";
import { getLang, getDict } from "@/lib/i18n/server";

/*
  Fonts are loaded with next/font, which self-hosts them (no layout shift, no
  request to Google at runtime) and exposes each as a CSS variable that our
  Tailwind theme picks up. IBM Plex Sans reads as financial and trustworthy;
  IBM Plex Mono gives the big figures a precise, tabular feel. Chinese glyphs
  fall back to the system CJK fonts declared in globals.css.
*/
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.metadata.title,
    description: t.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();

  return (
    <html
      lang={lang}
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-dvh flex-col">
        <LanguageProvider initialLang={lang}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
