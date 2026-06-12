import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import { escapeTelegramHtml, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/client";

export async function notifyAdminOfTaskRewardClaim(input: {
  userId: string;
  level: number;
  amount: number;
  levelName: string;
}): Promise<void> {
  if (!isTelegramConfigured()) return;

  const admin = createAdminClient();
  if (!admin) return;

  const { data: claimer } = await admin
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", input.userId)
    .single();

  if (!claimer || claimer.role === "admin") return;

  const displayName =
    claimer.full_name?.trim() || claimer.email?.split("@")[0] || "Player";
  const email = claimer.email ?? "unknown";
  const usersUrl = `${SITE_URL}/admin/users`;

  const lines = [
    "💰 <b>Daily task reward claimed</b>",
    "",
    `<b>Player:</b> ${escapeTelegramHtml(displayName)}`,
    `<b>Email:</b> ${escapeTelegramHtml(email)}`,
    `<b>Level:</b> ${input.level} — ${escapeTelegramHtml(input.levelName)}`,
    `<b>Reward:</b> $${input.amount.toFixed(2)} → Bonus wallet`,
    "",
    `<a href="${usersUrl}">Open admin</a>`,
  ];

  const result = await sendTelegramMessage(lines.join("\n"));
  if (!result.ok && process.env.NODE_ENV === "development") {
    console.warn("[telegram] task claim notify failed:", result.error);
  }
}
