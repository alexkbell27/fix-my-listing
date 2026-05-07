import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Fix My Listing",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
