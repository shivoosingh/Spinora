"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseInternationalPhone, isValidOtpCode } from "@/lib/auth/phone";

interface OtpAuthFormProps {
  mode: "login" | "register";
  channel: "phone" | "whatsapp";
  redirect?: string;
  referralCodeFromUrl?: string | null;
}

export function OtpAuthForm({ mode, channel, redirect = "/", referralCodeFromUrl }: OtpAuthFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || "");
  const [otp, setOtp] = useState("");
  const [e164Phone, setE164Phone] = useState("");
  const [loading, setLoading] = useState(false);

  const isWhatsApp = channel === "whatsapp";
  const numberLabel = isWhatsApp ? "WhatsApp Number" : "Phone Number";
  const codeHint = isWhatsApp
    ? "Enter the 6-digit code sent to your WhatsApp"
    : "Enter the 6-digit code sent via SMS";

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const phone = parseInternationalPhone(phoneInput);
    if (!phone) {
      toast.error("Enter a valid number with country code, e.g. +44 7911 123456");
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      toast.error("Authentication is not configured");
      setLoading(false);
      return;
    }

    const metadata: Record<string, string> = {};
    if (mode === "register") {
      metadata.full_name = fullName.trim();
      const ref = referralCode.trim() || referralCodeFromUrl || "";
      if (ref) metadata.referral_code = ref;
    }
    if (isWhatsApp) {
      metadata.whatsapp_number = phone;
      metadata.auth_method = "whatsapp";
    } else {
      metadata.auth_method = "phone";
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setE164Phone(phone);
    setStep("otp");
    toast.success(isWhatsApp ? "Verification code sent to WhatsApp!" : "Verification code sent via SMS!");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidOtpCode(otp)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      toast.error("Authentication is not configured");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: e164Phone,
      token: otp.trim(),
      type: "sms",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(mode === "register" ? "Account created! Welcome to Spinora." : "Welcome back!");
    router.push(redirect);
    router.refresh();
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Code sent to <strong className="text-foreground">{e164Phone}</strong>
        </p>
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            placeholder="123456"
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
          <p className="text-xs text-muted-foreground">{codeHint}</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : mode === "register" ? "Create Account" : "Sign In"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("details")}
          className="w-full text-sm text-muted-foreground hover:text-primary"
        >
          Change number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-4">
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
        <Label htmlFor="phone">{numberLabel}</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          required
          placeholder="+1 555 123 4567"
          className="font-mono text-base"
        />
        <p className="text-xs text-muted-foreground">
          {isWhatsApp
            ? "Enter your full WhatsApp number with country code — any country works (e.g. +44 7911 123456)."
            : "Enter your full mobile number with country code — any country works (e.g. +91 98765 43210)."}
        </p>
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

      <Button
        type="submit"
        className={`w-full ${isWhatsApp ? "bg-green-600 hover:bg-green-700" : ""}`}
        disabled={loading}
      >
        {loading ? "Sending code..." : "Send Verification Code"}
      </Button>
    </form>
  );
}
