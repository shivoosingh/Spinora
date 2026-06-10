"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      toast.error("Sign-in link expired or invalid. Try signing in again.");
    }
    if (searchParams.get("error") === "email_not_confirmed") {
      toast.error("Please confirm your email before accessing your account.");
    }
  }, [searchParams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in with your email and password after verifying your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <EmailAuthForm mode="login" redirect={redirect} />

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
