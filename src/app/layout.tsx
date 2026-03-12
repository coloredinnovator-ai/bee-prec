import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "BEE COOP",
  description: "A route-based cooperative legal clinic and reporting website rebuilt on GCP with a GitHub-backed operating ledger."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "production";

  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
        <div className="noise" aria-hidden="true" />
        <div className="site-shell">
          <SiteHeader />
          {appEnv !== "production" ? <div className="env-banner">{appEnv.toUpperCase()} environment</div> : null}
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
