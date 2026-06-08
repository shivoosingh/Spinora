"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("spinora-cookies");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("spinora-cookies", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl glass rounded-xl border border-purple-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          By using our site, you agree to our{" "}
          <Link href="/about" className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/about" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <button
          type="button"
          onClick={accept}
          className="px-6 py-2 rounded-lg gradient-bg text-white text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
