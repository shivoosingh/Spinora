"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthMethodPicker, type AuthMethod } from "@/components/auth/auth-method-picker";
import { OtpAuthForm } from "@/components/auth/otp-auth-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

function LoginForm() {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in with your phone, WhatsApp, or Gmail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuthMethodPicker value={method} onChange={setMethod} />

        {method === "phone" && (
          <OtpAuthForm mode="login" channel="phone" redirect={redirect} />
        )}
        {method === "whatsapp" && (
          <OtpAuthForm mode="login" channel="whatsapp" redirect={redirect} />
        )}
        {method === "gmail" && (
          <div className="space-y-4">
            <GoogleAuthButton redirect={redirect} label="Continue with Google" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or use email</span>
              </div>
            </div>
            <EmailAuthForm mode="login" redirect={redirect} />
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
