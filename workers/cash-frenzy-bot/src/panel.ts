import type { Locator, Page } from "playwright";
import { isLoginPage, log, screenshot, waitForManualLogin } from "./panel-utils.js";

const ADMIN_URL =
  process.env.CASHFRENZY_ADMIN_URL?.trim() || "https://agentserver.cashfrenzy777.com/admin/login";
const BASE_URL = ADMIN_URL.replace(/\/login.*$/i, ""); // .../admin
const ADMIN_HOME = `${BASE_URL}`;

/* ------------------------------------------------------------------ login */

export async function loginToPanel(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});

  if (!(await isLoginPage(page)) && (await hasNewAccountButton(page, 3000))) {
    log("login", "already on User List");
    return;
  }

  const onAdmin = /cashfrenzy777\.com\/admin/i.test(page.url()) && !(await isLoginPage(page));
  if (!onAdmin) {
    await page.goto(ADMIN_HOME, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  if (!(await isLoginPage(page))) {
    if (!(await isUserListReady(page))) await ensureUserList(page);
    log("login", "already authenticated");
    return;
  }

  const username = process.env.CASHFRENZY_AGENT_USERNAME?.trim();
  const password = process.env.CASHFRENZY_AGENT_PASSWORD?.trim();
  if (username) {
    await page
      .locator('input:not([type="password"]):not([type="hidden"])')
      .first()
      .fill(username)
      .catch(() => {});
  }
  if (password) {
    await page.locator('input[type="password"]').first().fill(password).catch(() => {});
  }

  const interactive =
    process.env.CASHFRENZY_HEADLESS === "false" || Boolean(process.env.CASHFRENZY_CDP_URL);
  if (interactive) {
    await waitForManualLogin(page);
    await ensureUserList(page);
    log("login", "success (manual captcha)");
    return;
  }

  await screenshot(page, "login-captcha");
  throw new Error(
    "Cash Frenzy login needs an image CAPTCHA. Run start-chrome-for-bot.bat, log in by hand, " +
      "open User List, then set CASHFRENZY_CDP_URL=http://127.0.0.1:9229 and start the bot."
  );
}

/* ---------------------------------------------------------- dialog helpers */

function visibleDialog(page: Page): Locator {
  return page.locator(".el-overlay:not([style*='display: none']) .el-dialog").last();
}

async function closeOverlays(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const dlg = visibleDialog(page);
    if (!(await dlg.isVisible().catch(() => false))) break;
    const cancel = dlg.locator("button").filter({ hasText: /^\s*(cancel|close)\s*$/i }).last();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click().catch(() => {});
    } else {
      const x = dlg.locator(".el-dialog__headerbtn").last();
      if (await x.isVisible().catch(() => false)) await x.click({ force: true }).catch(() => {});
      else await page.keyboard.press("Escape").catch(() => {});
    }
    await page.waitForTimeout(500);
  }
}

async function typeInto(input: Locator, value: string): Promise<void> {
  await input.waitFor({ state: "visible", timeout: 10000 });
  await input.click();
  await input.fill("");
  await input.pressSequentially(value, { delay: 25 });
}

async function clickDialogButton(dlg: Locator, pattern: RegExp): Promise<void> {
  const footer = dlg.locator(".el-dialog__footer button, button").filter({ hasText: pattern }).last();
  await footer.waitFor({ state: "visible", timeout: 8000 });
  await footer.click();
}

/* ----------------------------------------------------------- user listing */

function newAccountButton(page: Page): Locator {
  return page.locator("button.el-button, .el-button, button").filter({ hasText: /new account/i }).first();
}

async function hasNewAccountButton(page: Page, timeoutMs = 3000): Promise<boolean> {
  await page.bringToFront().catch(() => {});
  if (
    await page
      .locator(".el-button, button")
      .filter({ hasText: /new account/i })
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return true;
  }
  try {
    return await page.evaluate(() => {
      return [...document.querySelectorAll("button, .el-button, a")].some((el) =>
        /new account/i.test(el.textContent ?? "")
      );
    });
  } catch {
    return false;
  }
}

async function clickNewAccount(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});
  const btn = newAccountButton(page);
  if (await btn.isVisible().catch(() => false)) {
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ force: true });
    return;
  }
  const clicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, .el-button, a")];
    const target = els.find((el) => /new account/i.test(el.textContent ?? ""));
    if (!target) return false;
    (target as HTMLElement).click();
    return true;
  });
  if (!clicked) throw new Error("New Account button not found on page");
  log("create", "clicked New Account via DOM");
}

async function isUserListReady(page: Page): Promise<boolean> {
  return hasNewAccountButton(page, 1500);
}

async function pageLooksLike404(page: Page): Promise<boolean> {
  const url = page.url();
  if (/\/userList|\/userManagement/i.test(url)) return true;
  const body = (await page.locator("body").innerText().catch(() => "")).trim();
  return /404\s*not\s*found/i.test(body) && body.length < 200;
}

async function clickSidebarUserList(page: Page): Promise<void> {
  const candidates: Locator[] = [
    page.locator(".el-menu-item").filter({ hasText: /user list/i }),
    page.getByText("User List", { exact: true }),
    page.locator("a, li, span").filter({ hasText: /^\s*User List\s*$/i }),
  ];
  for (const loc of candidates) {
    const item = loc.first();
    if (await item.isVisible().catch(() => false)) {
      log("nav", "clicking User List in sidebar");
      await item.click().catch(() => {});
      await page.waitForTimeout(1500);
      return;
    }
  }
}

/**
 * Cash Frenzy is a SPA on /admin only — never open /admin/userList or /admin/userManagement (both 404).
 */
async function ensureUserList(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});
  await page.waitForTimeout(400);
  await closeOverlays(page);
  if (await hasNewAccountButton(page, 5000)) {
    log("nav", "User List ready");
    return;
  }

  // CDP-connected Chrome sometimes hides buttons from Playwright visibility — wait and retry.
  await page.waitForTimeout(2000);
  if (await hasNewAccountButton(page, 3000)) {
    log("nav", "User List ready (after wait)");
    return;
  }

  if (await pageLooksLike404(page)) {
    log("nav", "404 tab — returning to /admin");
    await page.goto(ADMIN_HOME, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  if (/cashfrenzy777\.com\/admin/i.test(page.url())) {
    await clickSidebarUserList(page);
  }

  if (await hasNewAccountButton(page, 12000)) {
    log("nav", "User List ready after sidebar click");
    return;
  }

  // Operator keeps User List open on /admin — CDP visibility can lie; don't block the job.
  if (/cashfrenzy777\.com\/admin/i.test(page.url()) && !(await isLoginPage(page))) {
    log("nav", "on /admin logged in — continuing");
    return;
  }

  await screenshot(page, "user-list-nav-failed");
  throw new Error(
    "Could not see the New Account button on /admin. Open User List in the sidebar, then retry."
  );
}

function searchInput(page: Page): Locator {
  return page
    .locator(
      'input[placeholder*="search content" i], input[placeholder*="please enter" i], .el-input__inner[placeholder*="search" i], .el-input__inner[placeholder*="enter" i]'
    )
    .first();
}

/** Main player table — prefer the one showing Account / Balance columns. */
function listTable(page: Page): Locator {
  const withAccount = page.locator(".el-table").filter({ has: page.locator("th").filter({ hasText: /^Account$/i }) });
  return withAccount.first().or(page.locator(".el-table").first());
}

async function searchAccount(page: Page, account: string): Promise<void> {
  await ensureUserList(page);
  const search = searchInput(page);
  await search.waitFor({ state: "visible", timeout: 15000 });
  await search.click();
  await search.fill("");
  await search.fill(account);

  const btn = page.getByRole("button", { name: /^\s*search\s*$/i }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
  else await search.press("Enter");
  await page.waitForTimeout(1800);
}

/** Row in the main list whose Account cell exactly equals `account`. */
function accountRow(page: Page, account: string): Locator {
  return listTable(page)
    .locator(".el-table__body-wrapper tbody tr")
    .filter({ has: page.locator(`.cell:text-is("${account}")`) })
    .first();
}

async function findRow(page: Page, account: string): Promise<Locator> {
  await searchAccount(page, account);
  const row = accountRow(page, account);
  if (!(await row.isVisible().catch(() => false))) {
    await screenshot(page, "user-not-found");
    throw new Error(`Account "${account}" not found in panel`);
  }
  return row;
}

/** Does an account name already exist? (exact match, non-throwing) */
async function accountExists(page: Page, account: string): Promise<boolean> {
  await searchAccount(page, account);
  return accountRow(page, account)
    .isVisible()
    .catch(() => false);
}

/* -------------------------------------------------------- balance reading */

async function balanceColumnIndex(page: Page): Promise<number> {
  const headers = await listTable(page)
    .locator(".el-table__header th")
    .allInnerTexts()
    .catch(() => [] as string[]);
  const idx = headers.findIndex((h) => /balance/i.test(h) && !/bonus/i.test(h));
  return idx >= 0 ? idx : 4;
}

function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export async function readBalance(page: Page, account: string): Promise<number> {
  const row = await findRow(page, account);
  const idx = await balanceColumnIndex(page);
  const cell = row.locator("td").nth(idx);
  const text = (await cell.innerText().catch(() => "")).trim();
  const value = parseAmount(text);
  if (value === null) {
    await screenshot(page, "balance-parse-failed");
    throw new Error(`Could not read balance for "${account}" (raw: "${text}")`);
  }
  log("balance", `${account} = ${value}`);
  return value;
}

/* ------------------------------------------------ editor → action buttons */

async function openEditor(page: Page, account: string): Promise<void> {
  const row = await findRow(page, account);
  await row.getByText(/^editor$/i).first().click();
  await page.waitForTimeout(1000);
}

async function fillAmountDialog(page: Page, amount: number, kind: "recharge" | "redeem"): Promise<void> {
  const dlg = visibleDialog(page);
  await dlg.waitFor({ state: "visible", timeout: 10000 });
  const amountInput = dlg.locator('input[type="number"]').first();
  await typeInto(amountInput, String(amount));
  await page.waitForTimeout(300);
  await clickDialogButton(dlg, /^\s*confirm\s*$/i);
  await page.waitForTimeout(2000);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  log(kind, `${kind} confirmed for $${amount}`);
}

/* --------------------------------------------------------------- recharge */

export async function rechargeAccount(page: Page, account: string, amount: number): Promise<void> {
  await openEditor(page, account);
  const btn = page.getByRole("button", { name: /^\s*recharge\s*$/i }).first();
  await btn.waitFor({ state: "visible", timeout: 8000 });
  await btn.click();
  await page.waitForTimeout(800);
  await fillAmountDialog(page, amount, "recharge");
}

/* ----------------------------------------------------------------- redeem */

export async function redeemAccount(
  page: Page,
  account: string,
  amount: number,
  redeemAll: boolean
): Promise<number> {
  let target = amount;
  if (redeemAll) {
    target = await readBalance(page, account);
    if (target <= 0) {
      log("redeem", `${account} has no balance to redeem`);
      return 0;
    }
  }

  await openEditor(page, account);
  const btn = page.getByRole("button", { name: /^\s*redeem\s*$/i }).first();
  await btn.waitFor({ state: "visible", timeout: 8000 });
  await btn.click();
  await page.waitForTimeout(800);
  await fillAmountDialog(page, target, "redeem");
  return target;
}

/* ------------------------------------------------------- account creation */

async function readPanelMessages(page: Page): Promise<string> {
  const messages = await page
    .locator(".el-message, .el-form-item__error")
    .allInnerTexts()
    .catch(() => [] as string[]);
  return messages.join(" ").replace(/\s+/g, " ").trim();
}

const DUPLICATE_RE = /exist|already|taken|duplicate|repeat|in ?use|have used|used|重复|已存在/i;

function createDialogOpen(page: Page): Promise<boolean> {
  return page
    .locator(".el-overlay:not([style*='display: none']) .el-dialog")
    .filter({ hasText: /Essential information/i })
    .last()
    .isVisible()
    .catch(() => false);
}

type CreateOutcome =
  | { status: "created" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

async function tryCreateOnce(page: Page, username: string, password: string): Promise<CreateOutcome> {
  await ensureUserList(page);
  await clickNewAccount(page);
  await page.waitForTimeout(1000);

  const dlg = visibleDialog(page);
  await dlg.waitFor({ state: "visible", timeout: 10000 });

  const textInputs = dlg.locator('input.el-input__inner:not([type="password"])');
  const passInputs = dlg.locator('input[type="password"]');

  await typeInto(textInputs.nth(0), username);
  await typeInto(passInputs.nth(0), password);
  await typeInto(passInputs.nth(1), password);

  await clickDialogButton(dlg, /^\s*save\s*$/i);
  await page.waitForTimeout(2000);

  const messages = await readPanelMessages(page);

  let stillOpen = await createDialogOpen(page);
  if (stillOpen && !DUPLICATE_RE.test(messages)) {
    await page.waitForTimeout(1200);
    stillOpen = await createDialogOpen(page);
  }

  if (!stillOpen) {
    await closeOverlays(page);
    return { status: "created" };
  }

  await closeOverlays(page);
  if (DUPLICATE_RE.test(messages)) {
    log("create", `username ${username} already exists (${messages})`);
    return { status: "duplicate" };
  }
  return { status: "error", message: messages || "create dialog stayed open (unknown panel error)" };
}

export async function createAccount(
  page: Page,
  baseUsername: string,
  password: string,
  variant: (base: string, attempt: number) => string
): Promise<{ username: string; password: string }> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const username = variant(baseUsername, attempt);

    if (await accountExists(page, username)) {
      log("create", `"${username}" already exists — trying next variant`);
      continue;
    }

    const outcome = await tryCreateOnce(page, username, password);
    if (outcome.status === "created") {
      log("create", `created ${username}`);
      return { username, password };
    }
    if (outcome.status === "duplicate") {
      continue;
    }

    await screenshot(page, "create-error");
    throw new Error(`Account creation failed: ${outcome.message}`);
  }

  await screenshot(page, "create-exhausted");
  throw new Error(`Could not create a unique account from base "${baseUsername}"`);
}
