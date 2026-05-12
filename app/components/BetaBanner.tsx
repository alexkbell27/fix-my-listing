"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const TALLY_FORM_URL = "https://tally.so/r/YOUR_FORM_ID";

export default function BetaBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: "#1D3557",
      color: "rgba(255,255,255,0.9)",
      fontSize: "0.8rem",
      textAlign: "center",
      padding: "0.55rem 1rem",
      lineHeight: 1.5,
    }}>
      You&apos;re using Fix My Listing free during our beta. Enjoying it?{" "}
      <a
        href={TALLY_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#A8DADC", fontWeight: 600, textDecoration: "none" }}
      >
        We&apos;d love your feedback →
      </a>
    </div>
  );
}
