"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthMethodPicker, type AuthMethod } from "@/components/auth/auth-method-picker";
import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

function RegisterForm() {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join Spinora — sign up with phone, WhatsApp, or Gmail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuthMethodPicker value={method} onChange={setMethod} />

        {method === "phone" && (
          <OtpAuthForm mode="register" channel="phone" referralCodeFromUrl={refFromUrl} />
        )}
        {method === "whatsapp" && (
          <OtpAuthForm mode="register" channel="whatsapp" referralCodeFromUrl={refFromUrl} />
        )}
        {method === "gmail" && (
          <div className="space-y-4">
            <GoogleAuthButton redirect="/" label="Sign up with Google" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or use email</span>
              </div>
            </div>
            <EmailAuthForm mode="register" referralCodeFromUrl={refFromUrl} />
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
