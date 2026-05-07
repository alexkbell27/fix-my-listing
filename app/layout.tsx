import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fix My Listing — Airbnb SEO & Search Ranking Tool",
  description: "Find out why your Airbnb listing isn't ranking in search — and get a step-by-step plan to rank higher and get found by more guests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
