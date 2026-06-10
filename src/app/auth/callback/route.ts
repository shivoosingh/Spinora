import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { syncProfileFromAuthMetadata } from "@/lib/actions/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirect = searchParams.get("redirect") || "/dashboard";
  const referralCode = searchParams.get("ref");
  const safeRedirect = redirect.startsWith("/") ? redirect : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback code error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      console.error("auth callback otp error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  await syncProfileFromAuthMetadata();

  if (referralCode?.trim()) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", user.id)
        .single();

      if (profile && !profile.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode.trim().toUpperCase())
          .single();

        if (referrer && referrer.id !== user.id) {
          await supabase
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", user.id);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
