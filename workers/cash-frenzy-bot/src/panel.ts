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
    log("login", "already authenticated on /admin");
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

async function typeIntoViaDom(input: Locator, value: string): Promise<void> {
  await input.evaluate((el, val) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, val);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: val, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function typeInto(input: Locator, value: string): Promise<void> {
  if (await input.isVisible().catch(() => false)) {
    await input.click();
    await input.fill("");
    await input.pressSequentially(value, { delay: 25 });
    return;
  }
  await typeIntoViaDom(input, value);
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

async function ensureUserList(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});
  await closeOverlays(page);

  const ready = await page.evaluate(() =>
    [...document.querySelectorAll("button, .el-button")].some((el) =>
      /new account/i.test(el.textContent ?? "")
    )
  );
  if (ready) {
    log("nav", "User List ready");
    return;
  }

  if (await pageLooksLike404(page)) {
    log("nav", "404 tab — returning to /admin");
    await page.goto(ADMIN_HOME, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  if (/cashfrenzy777\.com\/admin/i.test(page.url()) && !(await isLoginPage(page))) {
    log("nav", "on /admin — proceeding with create");
    return;
  }

  await screenshot(page, "user-list-nav-failed");
  throw new Error("Not logged in on /admin. Open User List in bot Chrome, then retry.");
}

async function waitForCreateDialog(page: Page, timeoutMs = 12000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll(".el-dialog")];
      return dialogs.some((d) => {
        const hidden = d.closest(".el-overlay")?.getAttribute("style")?.includes("display: none");
        if (hidden) return false;
        return d.querySelector('input[type="password"]') !== null;
      });
    });
    if (found) return true;
    await page.waitForTimeout(350);
  }
  return false;
}

async function readDomMessages(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".el-message, .el-form-item__error, .el-message-box__message")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join(" ")
  );
}

async function createDialogStillOpen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    for (const overlay of document.querySelectorAll(".el-overlay")) {
      if (overlay.getAttribute("style")?.includes("display: none")) continue;
      const dlg = overlay.querySelector(".el-dialog");
      if (dlg?.querySelector('input[type="password"]')) return true;
    }
    return false;
  });
}

async function fillAndSaveCreateDialog(page: Page, username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  return page.evaluate(
    ({ user, pass }) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      const setVal = (el: HTMLInputElement, val: string) => {
        setter?.call(el, val);
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: val, inputType: "insertText" }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };

      let dlg: Element | undefined;
      for (const overlay of document.querySelectorAll(".el-overlay")) {
        if (overlay.getAttribute("style")?.includes("display: none")) continue;
        const candidate = overlay.querySelector(".el-dialog");
        if (candidate?.querySelector('input[type="password"]')) {
          dlg = candidate;
          break;
        }
      }
      if (!dlg) {
        dlg = [...document.querySelectorAll(".el-dialog")].find((d) => d.querySelector('input[type="password"]'));
      }
      if (!dlg) return { ok: false, error: "create dialog not found" };

      const textInputs = [
        ...dlg.querySelectorAll('input.el-input__inner:not([type="password"]), input:not([type="password"]):not([type="hidden"])'),
      ].filter((el) => (el as HTMLInputElement).type !== "checkbox") as HTMLInputElement[];
      const passInputs = [...dlg.querySelectorAll('input[type="password"]')] as HTMLInputElement[];

      if (textInputs.length < 1 || passInputs.length < 2) {
        return { ok: false, error: `create form inputs missing (text=${textInputs.length}, pass=${passInputs.length})` };
      }

      setVal(textInputs[0], user);
      setVal(passInputs[0], pass);
      setVal(passInputs[1], pass);

      const saveBtn = [...dlg.querySelectorAll("button, .el-button")].find((b) =>
        /^\s*save\s*$/i.test(b.textContent ?? "")
      );
      if (!saveBtn) return { ok: false, error: "Save button not found" };
      (saveBtn as HTMLElement).click();
      return { ok: true };
    },
    { user: username, pass: password }
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

async function searchAccountViaDom(page: Page, account: string): Promise<boolean> {
  return page.evaluate((term) => {
    const inputs = [
      ...document.querySelectorAll('input.el-input__inner, input[type="text"], input:not([type="password"]):not([type="hidden"])'),
    ];
    const search = inputs.find((el) => /search|please enter/i.test(el.getAttribute("placeholder") ?? ""));
    if (!search) return false;

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(search, term);
    search.dispatchEvent(new InputEvent("input", { bubbles: true, data: term, inputType: "insertText" }));
    search.dispatchEvent(new Event("change", { bubbles: true }));

    const btn = [...document.querySelectorAll("button, .el-button")].find((el) =>
      /^\s*search\s*$/i.test(el.textContent ?? "")
    );
    (btn as HTMLElement | undefined)?.click();
    return true;
  }, account);
}

async function searchAccount(page: Page, account: string): Promise<void> {
  await ensureUserList(page);
  const search = searchInput(page);
  if (await search.isVisible().catch(() => false)) {
    await search.click();
    await search.fill("");
    await search.fill(account);
    const btn = page.getByRole("button", { name: /^\s*search\s*$/i }).first();
    if (await btn.isVisible().catch(() => false)) await btn.click();
    else await search.press("Enter");
  } else if (await searchAccountViaDom(page, account)) {
    log("search", `searched "${account}" via DOM`);
  } else {
    throw new Error(`Could not find search input for account "${account}"`);
  }
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
  log("create", `opening create dialog for ${username}`);

  if (!(await waitForCreateDialog(page))) {
    await screenshot(page, "create-dialog-missing");
    return { status: "error", message: "Create dialog did not open after New Account click" };
  }

  const filled = await fillAndSaveCreateDialog(page, username, password);
  if (!filled.ok) {
    await screenshot(page, "create-fill-failed");
    return { status: "error", message: filled.error ?? "Could not fill create form" };
  }
  log("create", "submitted Save");

  await page.waitForTimeout(2500);
  const messages = await readDomMessages(page);

  let stillOpen = await createDialogStillOpen(page);
  if (stillOpen && !DUPLICATE_RE.test(messages)) {
    await page.waitForTimeout(1500);
    stillOpen = await createDialogStillOpen(page);
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

    // Skip pre-search — CDP often can't see the search box; duplicates handled in tryCreateOnce.
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
