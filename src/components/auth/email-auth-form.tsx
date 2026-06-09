"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EmailAuthFormProps {
  mode: "login" | "register";
  redirect?: string;
  referralCodeFromUrl?: string | null;
}

export function EmailAuthForm({ mode, redirect = "/", referralCodeFromUrl }: EmailAuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || "");
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Welcome back!");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            referral_code: referralCode.trim() || referralCodeFromUrl || undefined,
            auth_method: "email",
          },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created! Welcome to Spinora.");
    }

    router.push(redirect);
    router.refresh();
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
        <Label htmlFor="email">Gmail / Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@gmail.com"
        />
      </div>
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
            ? "Sign In with Email"
            : "Create Account with Email"}
      </Button>
    </form>
  );
}
