import { chromium, type Page } from "playwright";
import { join } from "path";

export interface BrowserSession {
  page: Page;
  close: () => Promise<void>;
}

const PANEL_HOST = "cashfrenzy777.com";

function envOptional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function launchOptions() {
  const headless = process.env.CASHFRENZY_HEADLESS !== "false";
  const proxy = envOptional("CASHFRENZY_PROXY");
  const browserKind = envOptional("CASHFRENZY_BROWSER") ?? "chrome";

  return {
    headless,
    slowMo: headless ? 0 : 100,
    ...(browserKind === "chromium" ? {} : { channel: browserKind as "chrome" }),
    proxy: proxy ? { server: proxy } : undefined,
    args: ["--disable-blink-features=AutomationControlled"],
  };
}

/** Pick the panel tab with User List open — avoid stale /userManagement 404 tabs. */
async function isUsablePanelPage(page: Page): Promise<boolean> {
  const url = page.url();
  if (!url.includes(PANEL_HOST) || url.includes("about:")) return false;
  if (/\/userList|\/userManagement/i.test(url)) return false;

  const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
  if (/404\s*not\s*found/i.test(body) && body.length < 200) return false;

  return /backend/i.test(body) || /new account/i.test(body);
}

async function findPanelPage(pages: Page[]): Promise<Page> {
  for (const page of pages) {
    if (!(await isUsablePanelPage(page))) continue;
    await page.bringToFront().catch(() => {});
    if (await page.locator(".el-button, button").filter({ hasText: /new account/i }).first().isVisible().catch(() => false)) {
      console.log("[cf] Using tab:", page.url());
      return page;
    }
  }

  for (const page of pages) {
    if (await isUsablePanelPage(page)) {
      console.log("[cf] Using tab:", page.url());
      await page.bringToFront().catch(() => {});
      return page;
    }
  }

  for (const page of pages) {
    const url = page.url();
    if (url.includes(PANEL_HOST) && !url.includes("about:") && !/\/userList|\/userManagement/i.test(url)) {
      console.log("[cf] Using tab:", url);
      await page.bringToFront();
      return page;
    }
  }

  for (const page of pages) {
    const title = await page.title().catch(() => "");
    if (/backend|management|vault/i.test(title)) {
      console.log("[cf] Using tab by title:", title);
      await page.bringToFront();
      return page;
    }
  }

  const fallback = pages.find(
    (p) => !p.url().includes("about:blank") && !p.url().startsWith("chrome-extension:")
  );
  if (fallback) {
    console.log("[cf] Using first non-blank tab:", fallback.url());
    await fallback.bringToFront();
    return fallback;
  }

  throw new Error(
    "No Cash Frenzy tab found in Chrome. Open the agent panel (agentserver.cashfrenzy777.com) in the bot Chrome, then retry."
  );
}

export async function openBrowserSession(): Promise<BrowserSession> {
  const cdpUrl = envOptional("CASHFRENZY_CDP_URL");
  const profileDir =
    envOptional("CASHFRENZY_CHROME_PROFILE_DIR") ?? join(process.cwd(), "chrome-bot-profile");

  if (cdpUrl) {
    console.log("[cf] Connecting to your Chrome via CDP (VPN should already be on)…");
    try {
      const browser = await chromium.connectOverCDP(cdpUrl, { slowMo: 100 });
      const context = browser.contexts()[0] ?? (await browser.newContext());
      const pages = context.pages();
      const page = pages.length > 0 ? await findPanelPage(pages) : await context.newPage();
      return {
        page,
        close: async () => {
          browser.close().catch(() => {});
        },
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("No Cash Frenzy tab")) throw err;
      throw new Error(
        "Could not connect to Chrome over CDP. Run start-chrome-for-bot.bat first, connect VPN, then start the bot."
      );
    }
  }

  console.log("[cf] Launching Google Chrome with bot profile…");
  const context = await chromium.launchPersistentContext(profileDir, {
    ...launchOptions(),
    viewport: { width: 1366, height: 900 },
    ignoreDefaultArgs: ["--enable-automation"],
  });

  const pages = context.pages();
  const page = pages.length > 0 ? await findPanelPage(pages) : await context.newPage();
  return {
    page,
    close: async () => {
      await context.close();
    },
  };
}

export function vpnHint(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("ERR_CONNECTION_REFUSED") ||
    msg.includes("ERR_CONNECTION_RESET") ||
    msg.includes("ERR_NAME_NOT_RESOLVED") ||
    msg.includes("ERR_TIMED_OUT") ||
    msg.includes("net::ERR")
  ) {
    return (
      `${msg}\n\n` +
      "VPN fix: connect VPN in the bot Chrome window, then retry.\n" +
      "Run start-chrome-for-bot.bat → connect VPN → open the panel → start-bot.bat"
    );
  }
  return msg;
}
