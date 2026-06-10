"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DEFAULT_COUNTRY_ISO, PhoneNumberInput, phoneFromParts } from "@/components/auth/phone-number-input";
import { buildAuthCallbackUrl } from "@/lib/auth/callback-url";
import { normalizeEmail, formatAuthErrorMessage } from "@/lib/auth/identifier";
import {
  finalizeRegistrationAfterSignUp,
  isPhoneAvailable,
  signInWithEmailPassword,
} from "@/lib/actions/auth";

interface EmailAuthFormProps {
  mode: "login" | "register";
  redirect?: string;
  referralCodeFromUrl?: string | null;
}

function EmailConfirmationNotice({
  email,
  variant,
}: {
  email: string;
  variant: "register" | "login";
}) {
  return (
    <div className="space-y-4 text-center py-2">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
        <Mail className="h-7 w-7 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">Check your email</p>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a confirmation link to{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
      </div>
      <p className="text-sm text-muted-foreground rounded-lg bg-white/5 border border-white/10 p-3 text-left">
        {variant === "register" ? (
          <>
            Your account was created but is <strong className="text-foreground">not active yet</strong>.
            Open the email and click the confirmation link. You&apos;ll be redirected to Spinora and
            signed in automatically once verified.
          </>
        ) : (
          <>
            Your email is not verified yet. We sent a new confirmation link — click it to verify
            your account and you&apos;ll be signed in automatically.
          </>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        Open the link in the <strong className="text-foreground">same browser</strong> you used to
        register. Each link works once — request a new one from Sign In if it expired.
      </p>
      <p className="text-xs text-muted-foreground">Check spam if you don&apos;t see it in 1–2 minutes.</p>
      <Link href="/login" className="inline-block text-sm text-primary hover:underline">
        Go to sign in
      </Link>
    </div>
  );
}

export function EmailAuthForm({ mode, redirect = "/dashboard", referralCodeFromUrl }: EmailAuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      toast.error("Authentication is not configured");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const normalizedEmail = normalizeEmail(email);
      const result = await signInWithEmailPassword({
        email: normalizedEmail,
        password,
        redirect,
        callbackOrigin: window.location.origin,
      });

      setLoading(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (!result.loggedIn) {
        setPendingEmail(result.email);
        setAwaitingConfirmation(true);
        toast.success("Confirmation email sent! Verify your email to continue.");
        return;
      }

      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh();
      return;
    }

    const phone = phoneFromParts(countryIso, phoneLocal);
    if (!phone) {
      toast.error("Enter a valid phone number for your country");
      setLoading(false);
      return;
    }

    const phoneCheck = await isPhoneAvailable(phone);
    if (!phoneCheck.available) {
      toast.error(phoneCheck.error ?? "This phone number is already registered");
      setLoading(false);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const emailRedirectTo = buildAuthCallbackUrl(
      window.location.origin,
      redirect,
      referralCode.trim() || referralCodeFromUrl || undefined
    );

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
          phone,
          referral_code: referralCode.trim() || referralCodeFromUrl || undefined,
          auth_method: "email",
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(formatAuthErrorMessage(error.message));
      return;
    }

    if (!data.user) {
      setLoading(false);
      toast.error("Could not create account");
      return;
    }

    if (data.user.identities?.length === 0) {
      setLoading(false);
      toast.error("This email is already registered. Go to Sign In instead.");
      return;
    }

    const saved = await finalizeRegistrationAfterSignUp({
      userId: data.user.id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone,
    });

    if (!saved.ok) {
      setLoading(false);
      toast.error(saved.error ?? "Account created but phone was not saved");
      return;
    }

    // Email confirmation enabled — no session until user clicks email link
    if (!data.session) {
      setLoading(false);
      setPendingEmail(normalizedEmail);
      setAwaitingConfirmation(true);
      toast.success("Account created! Check your email to confirm.");
      return;
    }

    // Instant login (Confirm email OFF in Supabase)
    setLoading(false);
    toast.success("Account created! Welcome to Spinora.");
    router.push(redirect);
    router.refresh();
  }

  if (awaitingConfirmation && pendingEmail) {
    return <EmailConfirmationNotice email={pendingEmail} variant={mode} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <PhoneNumberInput
            id="phone"
            countryIso={countryIso}
            onCountryIsoChange={setCountryIso}
            localNumber={phoneLocal}
            onLocalNumberChange={setPhoneLocal}
            required
          />
          <p className="text-xs text-muted-foreground">
            Select your country, then enter your number without the country code.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === "login" && (
            <Link href="/reset-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "register" ? 6 : undefined}
        />
      </div>
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="referral">Referral Code (optional)</Label>
          <Input
            id="referral"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            readOnly={!!referralCodeFromUrl}
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? mode === "login"
            ? "Signing in..."
            : "Creating account..."
          : mode === "login"
            ? "Sign In"
            : "Create Account"}
      </Button>
      {mode === "register" && (
        <p className="text-xs text-muted-foreground text-center">
          Create your account and start playing right away.
        </p>
      )}
      {mode === "login" && (
        <p className="text-xs text-muted-foreground text-center">
          Sign in with the email and password you registered with.
        </p>
      )}
    </form>
  );
}
