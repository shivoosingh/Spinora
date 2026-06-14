import type { GameLoadJob, BotResult } from "./types.js";
import { planCreateAccount, variantFromPlan } from "../../shared/numbered-credentials.js";
import { openBrowserSession, vpnHint } from "./browser.js";
import {
  loginToPanel,
  createAccount,
  rechargeAccount,
  redeemAccount,
  readBalance,
} from "./panel.js";
import { log, screenshot } from "./panel-utils.js";

export async function runJob(job: GameLoadJob): Promise<BotResult> {
  const session = await openBrowserSession();
  const { page, close } = session;

  try {
    await loginToPanel(page);

    if (job.load_type === "create_account" || job.load_type === "new_account") {
      const plan = planCreateAccount(job);
      log(
        "create-user",
        `${plan.stem} from #${plan.startNum} (requester: ${job.requester_name ?? job.requester_email ?? job.user_id})`
      );
      const creds = await createAccount(
        page,
        plan.stem,
        plan.preferredPassword ?? "",
        variantFromPlan(plan),
        { forceNewAccount: plan.forceNewAccount }
      );
      return creds;
    }

    if (job.load_type === "load" || job.load_type === "reload") {
      const username = job.game_username?.trim();
      if (!username) throw new Error("Load requires game username");
      await rechargeAccount(page, username, Number(job.amount));
      return { username };
    }

    if (job.load_type === "redeem") {
      const username = job.game_username?.trim();
      if (!username) throw new Error("Redeem requires game username");
      const redeemedAmount = await redeemAccount(
        page,
        username,
        Number(job.amount),
        Boolean(job.redeem_all)
      );
      return { username, redeemedAmount };
    }

    if (job.load_type === "check_balance") {
      const username = job.game_username?.trim();
      if (!username) throw new Error("Check balance requires game username");
      const balance = await readBalance(page, username);
      return { username, balance };
    }

    throw new Error(`Unknown load type: ${job.load_type}`);
  } catch (err) {
    await screenshot(page, "error");
    throw new Error(vpnHint(err));
  } finally {
    if (!process.env.CASHMACHINE_CDP_URL) {
      await close();
    }
  }
}
