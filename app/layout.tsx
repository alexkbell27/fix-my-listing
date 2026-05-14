import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "#1D3557",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fixmylisting.com"),
  title: "Fix My Listing — Airbnb SEO & Search Ranking Tool",
  description: "Find out exactly why your Airbnb listing isn't ranking in search — and get a step-by-step plan to fix it. First report free.",
  icons: { icon: "/logo-icon.png" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fix My Listing" },
  openGraph: {
    title: "Fix My Listing — Airbnb SEO & Search Ranking Tool",
    description: "Find out exactly why your Airbnb listing isn't ranking in search.",
    url: "https://fixmylisting.com",
    siteName: "Fix My Listing",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fix My Listing",
    description: "Airbnb SEO analysis in minutes.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body>
        {children}
        <Toaster position="bottom-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
