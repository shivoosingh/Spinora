import { chromium, type Page } from "playwright";
import { join } from "path";

export interface BrowserSession {
  page: Page;
  close: () => Promise<void>;
}

const PANEL_HOST = "mrallinone777.com";

function envOptional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function launchOptions() {
  const headless = process.env.MRALLINONE_HEADLESS !== "false";
  const proxy = envOptional("MRALLINONE_PROXY");
  const browserKind = envOptional("MRALLINONE_BROWSER") ?? "chrome";

  return {
    headless,
    slowMo: headless ? 0 : 100,
    ...(browserKind === "chromium" ? {} : { channel: browserKind as "chrome" }),
    proxy: proxy ? { server: proxy } : undefined,
    args: ["--disable-blink-features=AutomationControlled"],
  };
}

/** Prefer /admin dashboard (manual workflow); also accept standalone player/index tab. */
async function findPanelPage(pages: Page[]): Promise<Page> {
  const dashboard = pages.find((p) => {
    const url = p.url();
    return (
      url.includes(PANEL_HOST) &&
      !url.includes("about:") &&
      (/\/admin\/?$/i.test(url) || (url.includes("/admin") && !url.includes("/player/") && !url.includes("/login")))
    );
  });
  if (dashboard) {
    console.log("[maio] Using tab:", dashboard.url());
    await dashboard.bringToFront();
    return dashboard;
  }

  const playerList = pages.find((p) => /player\/index/i.test(p.url()));
  if (playerList) {
    console.log("[maio] Using tab:", playerList.url());
    await playerList.bringToFront();
    return playerList;
  }

  for (const page of pages) {
    const url = page.url();
    if (url.includes(PANEL_HOST) && !url.includes("about:")) {
      console.log("[maio] Using tab:", url);
      await page.bringToFront();
      return page;
    }
  }

  for (const page of pages) {
    const title = await page.title().catch(() => "");
    if (/backend|management|mrallinone|all.in.one/i.test(title)) {
      console.log("[maio] Using tab by title:", title);
      await page.bringToFront();
      return page;
    }
  }

  const fallback = pages.find(
    (p) => !p.url().includes("about:blank") && !p.url().startsWith("chrome-extension:")
  );
  if (fallback) {
    console.log("[maio] Using first non-blank tab:", fallback.url());
    await fallback.bringToFront();
    return fallback;
  }

  throw new Error(
    "No MR All In One tab found in Chrome. Open the agent panel (agentserver.mrallinone777.com) in the bot Chrome, then retry."
  );
}

export async function openBrowserSession(): Promise<BrowserSession> {
  const cdpUrl = envOptional("MRALLINONE_CDP_URL");
  const profileDir =
    envOptional("MRALLINONE_CHROME_PROFILE_DIR") ?? join(process.cwd(), "chrome-bot-profile");

  if (cdpUrl) {
    console.log("[maio] Connecting to your Chrome via CDP (VPN should already be on)…");
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
      if (err instanceof Error && err.message.includes("No MR All In One tab")) throw err;
      throw new Error(
        "Could not connect to Chrome over CDP. Run start-chrome-for-bot.bat first, connect VPN, then start the bot."
      );
    }
  }

  console.log("[maio] Launching Google Chrome with bot profile…");
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
    msg.includes("Target page") ||
    msg.includes("browser has been closed") ||
    msg.includes("Chrome tab was closed")
  ) {
    return (
      `${msg}\n\n` +
      "Keep the MR All In One User Management tab open in the bot Chrome (port 9227). Do not close that Chrome window while the bot is running."
    );
  }
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
