-- Confirm signup email uses a link (not OTP token)
-- Run in Supabase SQL Editor if needed; mainly configure template in Dashboard.

-- Ensure profiles has phone column (safe to re-run)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;
