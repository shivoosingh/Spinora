import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { enrichGameLoadJob } from "../../shared/enrich-game-load-job.js";
import { runJob } from "./bot.js";
import type { GameLoadJob } from "./types.js";

const POLL_MS = Number(process.env.CASHMACHINE_POLL_MS ?? 10_000);
const GAME_SLUG = "cash-machine";

function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in workers/cashmachine-bot/.env");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function claimNext(supabase: ReturnType<typeof createAdminSupabase>) {
  const { data, error } = await supabase.rpc("claim_next_game_load", { p_game_slug: GAME_SLUG });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as GameLoadJob | undefined) ?? null;
}

async function complete(
  supabase: ReturnType<typeof createAdminSupabase>,
  jobId: string,
  success: boolean,
  result: { username?: string; password?: string; error?: string; redeemedAmount?: number }
) {
  const { error } = await supabase.rpc("complete_game_load", {
    p_request_id: jobId,
    p_success: success,
    p_game_username: result.username ?? null,
    p_game_password: result.password ?? null,
    p_error_message: result.error ?? null,
    p_redeemed_amount: result.redeemedAmount ?? null,
  });
  if (error) throw error;
}

async function processOne(supabase: ReturnType<typeof createAdminSupabase>) {
  const job = await claimNext(supabase);
  if (!job) return false;

  console.log(`[cashmachine-bot] Processing job ${job.id} — $${job.amount} (${job.load_type})`);

  const enrichedJob = await enrichGameLoadJob(supabase, job as GameLoadJob);

  try {
    const result = await runJob(enrichedJob);
    await complete(supabase, job.id, true, {
      ...result,
      redeemedAmount: result.redeemedAmount ?? result.balance,
    });
    const credMsg = result.password
      ? `Username: ${result.username} | Password: ${result.password}`
      : `Account: ${result.username}`;
    const isCreate =
      enrichedJob.load_type === "create_account" || enrichedJob.load_type === "new_account";
    const isRedeem = enrichedJob.load_type === "redeem";
    const isCheck = enrichedJob.load_type === "check_balance";
    const redeemDest = enrichedJob.wallet_type === "bonus" ? "Bonus Redeem" : "Deposit Redeem";
    const redeemLabel = enrichedJob.redeem_all
      ? `$${Number(result.redeemedAmount ?? job.amount).toFixed(2)} (full balance)`
      : `$${Number(result.redeemedAmount ?? job.amount).toFixed(2)}`;
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: job.user_id,
      title: isCreate
        ? `${enrichedJob.game_name} account ready`
        : isRedeem
          ? `${enrichedJob.game_name} redeem complete`
          : isCheck
            ? `${enrichedJob.game_name} balance`
            : `${enrichedJob.game_name} load complete`,
      message: isCreate
        ? `Your account was created. ${credMsg}`
        : isRedeem
          ? `${redeemLabel} redeemed to your ${redeemDest} wallet. ${credMsg}`
          : isCheck
            ? `Your ${enrichedJob.game_name} balance is $${Number(result.balance ?? 0).toFixed(2)}.`
            : `$${Number(job.amount).toFixed(2)} loaded. ${credMsg}`,
      type: "success",
    });
    if (notifyError) console.warn("[cashmachine-bot] Notification failed:", notifyError.message);
    console.log(`[cashmachine-bot] Completed ${job.id} → user ${result.username}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cashmachine-bot] Failed ${job.id}:`, message);
    try {
      await complete(supabase, job.id, false, { error: message.slice(0, 500) });
    } catch (completeErr) {
      console.error("[cashmachine-bot] Could not mark job failed:", completeErr);
    }
  }

  return true;
}

async function main() {
  const once = process.argv.includes("--once");
  const supabase = createAdminSupabase();

  console.log("[cashmachine-bot] Started — polling for Cash Machine wallet load jobs");

  do {
    try {
      const handled = await processOne(supabase);
      if (once) break;
      if (!handled) await new Promise((r) => setTimeout(r, POLL_MS));
    } catch (err) {
      console.error("[cashmachine-bot] Poll error (continuing):", err);
      if (once) break;
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  } while (!once);

  console.log("[cashmachine-bot] Done");
}

main().catch((err) => {
  console.error("[cashmachine-bot] Fatal:", err);
  process.exit(1);
});
