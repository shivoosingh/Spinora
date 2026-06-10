/** Build the OAuth / email-verification callback URL for the current environment */
export function getAuthCallbackUrl(redirect = "/"): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://spinoras.vercel.app";

  const url = new URL("/auth/callback", origin);
  url.searchParams.set("redirect", redirect);
  return url.toString();
}

export function getAuthCallbackUrlWithRef(redirect = "/", referralCode?: string | null): string {
  const url = new URL(getAuthCallbackUrl(redirect));
  if (referralCode?.trim()) {
    url.searchParams.set("ref", referralCode.trim());
  }
  return url.toString();
}

/** Server-side callback URL (pass request origin from the client in dev) */
export function buildAuthCallbackUrl(
  origin: string,
  redirect = "/dashboard",
  referralCode?: string | null
): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("redirect", redirect.startsWith("/") ? redirect : "/dashboard");
  if (referralCode?.trim()) {
    url.searchParams.set("ref", referralCode.trim());
  }
  return url.toString();
}
