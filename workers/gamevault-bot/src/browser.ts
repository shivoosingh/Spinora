import { chromium, type Page } from "playwright";
import { join } from "path";

export interface BrowserSession {
  page: Page;
  close: () => Promise<void>;
}

const PANEL_HOST = "gamevault999.com";

function envOptional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function launchOptions() {
  const headless = process.env.GAMEVAULT_HEADLESS !== "false";
  const proxy = envOptional("GAMEVAULT_PROXY");
  const browserKind = envOptional("GAMEVAULT_BROWSER") ?? "chrome";

  return {
    headless,
    slowMo: headless ? 0 : 100,
    ...(browserKind === "chromium" ? {} : { channel: browserKind as "chrome" }),
    proxy: proxy ? { server: proxy } : undefined,
    args: ["--disable-blink-features=AutomationControlled"],
  };
}

/** Pick the panel tab, not about:blank or VPN extension tabs */
async function findPanelPage(pages: Page[]): Promise<Page> {
  for (const page of pages) {
    const url = page.url();
    if (url.includes(PANEL_HOST) && !url.includes("about:")) {
      console.log("[gv] Using tab:", url);
      await page.bringToFront();
      return page;
    }
  }

  for (const page of pages) {
    const title = await page.title().catch(() => "");
    if (/backend|management|vault/i.test(title)) {
      console.log("[gv] Using tab by title:", title);
      await page.bringToFront();
      return page;
    }
  }

  const fallback = pages.find(
    (p) => !p.url().includes("about:blank") && !p.url().startsWith("chrome-extension:")
  );
  if (fallback) {
    console.log("[gv] Using first non-blank tab:", fallback.url());
    await fallback.bringToFront();
    return fallback;
  }

  throw new Error(
    "No Game Vault tab found in Chrome. Open the agent panel (agent.gamevault999.com) in the bot Chrome, then retry."
  );
}

export async function openBrowserSession(): Promise<BrowserSession> {
  const cdpUrl = envOptional("GAMEVAULT_CDP_URL");
  const profileDir =
    envOptional("GAMEVAULT_CHROME_PROFILE_DIR") ?? join(process.cwd(), "chrome-bot-profile");

  if (cdpUrl) {
    console.log("[gv] Connecting to your Chrome via CDP (VPN should already be on)…");
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
      if (err instanceof Error && err.message.includes("No Game Vault tab")) throw err;
      throw new Error(
        "Could not connect to Chrome over CDP. Run start-chrome-for-bot.bat first, connect VPN, then start the bot."
      );
    }
  }

  console.log("[gv] Launching Google Chrome with bot profile…");
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
