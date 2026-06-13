import type { Frame, Locator, Page } from "playwright";
import { isLoginPage, log, screenshot, waitForManualLogin } from "./panel-utils.js";

const ADMIN_URL =
  process.env.CASHFRENZY_ADMIN_URL?.trim() || "https://agentserver.cashfrenzy777.com/admin/login";
const BASE_URL = ADMIN_URL.replace(/\/login.*$/i, ""); // .../admin
const ADMIN_HOME = `${BASE_URL}`;

/* ------------------------------------------------------------------ login */

export async function loginToPanel(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});

  if (!(await isLoginPage(page)) && (await hasNewAccountButton(page))) {
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
  await input.waitFor({ state: "attached", timeout: 8000 }).catch(() => {});
  try {
    await input.click({ force: true, timeout: 3000 });
    await input.fill("");
    await input.pressSequentially(value, { delay: 25 });
    return;
  } catch {
    await typeIntoViaDom(input, value);
  }
}

async function clickDialogButton(dlg: Locator, pattern: RegExp): Promise<void> {
  const footer = dlg.locator(".el-dialog__footer button, button").filter({ hasText: pattern }).last();
  if (await footer.count()) {
    const box = await footer.boundingBox().catch(() => null);
    if (box) {
      const page = dlg.page();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      return;
    }
    await footer.click({ force: true, timeout: 8000 });
    return;
  }
  throw new Error(`Dialog button not found: ${pattern.source}`);
}

/** Click button by walking DOM + iframes (works when Playwright can't "see" the dialog). */
async function clickButtonByDomWalk(page: Page, pattern: RegExp): Promise<boolean> {
  const source = pattern.source;
  const flags = pattern.flags;
  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(
        ({ source, flags }) => {
          const re = new RegExp(source, flags);
          const walk = (doc: Document): boolean => {
            for (const el of doc.querySelectorAll("button, .el-button, a")) {
              const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
              if (!re.test(text)) continue;
              (el as HTMLElement).click();
              return true;
            }
            for (const iframe of doc.querySelectorAll("iframe")) {
              try {
                const inner = iframe.contentDocument;
                if (inner && walk(inner)) return true;
              } catch {
                /* cross-origin */
              }
            }
            return false;
          };
          return walk(document);
        },
        { source, flags }
      )
      .catch(() => false);
    if (clicked) return true;
  }
  return false;
}

async function createDialogLocator(page: Page): Promise<Locator | null> {
  const roots: Array<Page | Frame> = [page, ...page.frames()];
  for (const root of roots) {
    const dlg = root.locator(".el-dialog, [role='dialog']").filter({ hasText: /Essential information/i }).last();
    if ((await dlg.count()) > 0 && (await dlg.locator('input[type="password"]').count()) >= 2) {
      return dlg;
    }
  }
  for (const root of roots) {
    const dlg = root.locator(".el-dialog, [role='dialog']").last();
    if ((await dlg.count()) > 0 && (await dlg.locator('input[type="password"]').count()) >= 2) {
      return dlg;
    }
  }
  return null;
}

type LabelInputCoord = { x: number; y: number; label: string };

/** Find Account / Login password / Confirm password by form label (not field order). */
async function findCreateInputsByLabel(page: Page): Promise<LabelInputCoord[]> {
  return page.mainFrame().evaluate(() => {
    const out: LabelInputCoord[] = [];
    const wanted: Array<{ label: string; re: RegExp }> = [
      { label: "Account", re: /^account$/i },
      { label: "Login password", re: /^login password$/i },
      { label: "Confirm password", re: /^confirm password$/i },
    ];

    const collect = (doc: Document, ox = 0, oy = 0): void => {
      const dialogs = [...doc.querySelectorAll(".el-dialog, [role='dialog']")].filter((dlg) =>
        /essential information/i.test(dlg.textContent ?? "")
      );
      const roots = dialogs.length ? dialogs : [...doc.querySelectorAll(".el-dialog, [role='dialog']")];

      for (const root of roots) {
        for (const { label, re } of wanted) {
          if (out.some((h) => h.label === label)) continue;
          for (const lbl of root.querySelectorAll(".el-form-item__label, label")) {
            const text = (lbl.textContent ?? "").replace(/\*/g, "").replace(/\s+/g, " ").trim();
            if (!re.test(text)) continue;
            const input = lbl.closest(".el-form-item")?.querySelector("input") as HTMLInputElement | null;
            if (!input) continue;
            const r = input.getBoundingClientRect();
            if (r.width < 8 || r.height < 8) continue;
            out.push({ label, x: ox + r.x + r.width / 2, y: oy + r.y + r.height / 2 });
            break;
          }
        }
      }

      for (const iframe of doc.querySelectorAll("iframe")) {
        try {
          const ir = iframe.getBoundingClientRect();
          const inner = iframe.contentDocument;
          if (inner) collect(inner, ox + ir.x, oy + ir.y);
        } catch {
          /* cross-origin */
        }
      }
    };

    collect(document);
    return out;
  }).catch(() => [] as LabelInputCoord[]);
}

async function typeAtCoord(page: Page, x: number, y: number, value: string): Promise<void> {
  await page.mouse.click(x, y);
  await page.waitForTimeout(120);
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.type(value, { delay: 30 });
}

async function fillCreateByLabelsDom(
  page: Page,
  username: string,
  password: string
): Promise<boolean> {
  const ok = await page
    .mainFrame()
    .evaluate(
      ({ user, pass }) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        const setVal = (el: HTMLInputElement, val: string) => {
          el.focus();
          el.setAttribute("autocomplete", "off");
          setter?.call(el, val);
          el.dispatchEvent(new InputEvent("input", { bubbles: true, data: val, inputType: "insertText" }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("blur", { bubbles: true }));
        };

        const findInput = (root: Element, re: RegExp): HTMLInputElement | null => {
          for (const lbl of root.querySelectorAll(".el-form-item__label, label")) {
            const text = (lbl.textContent ?? "").replace(/\*/g, "").replace(/\s+/g, " ").trim();
            if (!re.test(text)) continue;
            const input = lbl.closest(".el-form-item")?.querySelector("input") as HTMLInputElement | null;
            if (input) return input;
          }
          return null;
        };

        const fillDialog = (doc: Document): boolean => {
          const dialogs = [...doc.querySelectorAll(".el-dialog, [role='dialog']")].filter((dlg) =>
            /essential information/i.test(dlg.textContent ?? "")
          );
          const roots = dialogs.length ? dialogs : [...doc.querySelectorAll(".el-dialog, [role='dialog']")];

          for (const root of roots) {
            const account = findInput(root, /^account$/i);
            const loginPass = findInput(root, /^login password$/i);
            const confirmPass = findInput(root, /^confirm password$/i);
            if (!account || !loginPass || !confirmPass) continue;

            setVal(account, user);
            setVal(loginPass, pass);
            setVal(confirmPass, pass);

            if (account.value !== user || loginPass.value !== pass || confirmPass.value !== pass) continue;

            const saveBtn = [...root.querySelectorAll("button, .el-button")].find((b) =>
              /^\s*save\s*$/i.test((b.textContent ?? "").trim())
            );
            if (!saveBtn) continue;
            (saveBtn as HTMLElement).click();
            return true;
          }
          return false;
        };

        const walk = (doc: Document): boolean => {
          if (fillDialog(doc)) return true;
          for (const iframe of doc.querySelectorAll("iframe")) {
            try {
              const inner = iframe.contentDocument;
              if (inner && walk(inner)) return true;
            } catch {
              /* cross-origin */
            }
          }
          return false;
        };

        return walk(document);
      },
      { user: username, pass: password }
    )
    .catch(() => false);
  return ok;
}

async function fillCreateByLabelCoords(
  page: Page,
  username: string,
  password: string
): Promise<boolean> {
  await page.bringToFront().catch(() => {});

  for (let attempt = 0; attempt < 8; attempt++) {
    const fields = await findCreateInputsByLabel(page);
    const account = fields.find((f) => f.label === "Account");
    const loginPass = fields.find((f) => f.label === "Login password");
    const confirmPass = fields.find((f) => f.label === "Confirm password");
    if (!account || !loginPass || !confirmPass) {
      await page.waitForTimeout(400);
      continue;
    }

    await typeAtCoord(page, account.x, account.y, username);
    await typeAtCoord(page, loginPass.x, loginPass.y, password);
    await typeAtCoord(page, confirmPass.x, confirmPass.y, password);
    await page.waitForTimeout(300);

    const savePt = await page
      .mainFrame()
      .evaluate(() => {
        const walk = (doc: Document, ox = 0, oy = 0): { x: number; y: number } | null => {
          for (const dlg of doc.querySelectorAll(".el-dialog, [role='dialog']")) {
            if (!/essential information/i.test(dlg.textContent ?? "")) continue;
            for (const btn of dlg.querySelectorAll("button, .el-button")) {
              const text = (btn.textContent ?? "").replace(/\s+/g, " ").trim();
              if (!/^save$/i.test(text)) continue;
              const r = btn.getBoundingClientRect();
              if (r.width < 8) continue;
              return { x: ox + r.x + r.width / 2, y: oy + r.y + r.height / 2 };
            }
          }
          for (const iframe of doc.querySelectorAll("iframe")) {
            try {
              const ir = iframe.getBoundingClientRect();
              const inner = iframe.contentDocument;
              if (inner) {
                const hit = walk(inner, ox + ir.x, oy + ir.y);
                if (hit) return hit;
              }
            } catch {
              /* cross-origin */
            }
          }
          return null;
        };
        return walk(document);
      })
      .catch(() => null);

    if (savePt) {
      await page.mouse.click(savePt.x, savePt.y);
      return true;
    }
    if (await clickButtonByDomWalk(page, /^\s*save\s*$/i)) return true;
  }
  return false;
}

async function fillAndSaveCreateDialog(
  page: Page,
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  for (let i = 0; i < 10; i++) {
    if (await fillCreateByLabelsDom(page, username, password)) return { ok: true };
    if (await fillCreateByLabelCoords(page, username, password)) return { ok: true };
    await page.waitForTimeout(400);
  }

  const dlg = await createDialogLocator(page);
  if (dlg) {
    try {
      const accountInput = dlg
        .locator(".el-form-item")
        .filter({ has: dlg.locator(".el-form-item__label").filter({ hasText: /^Account$/i }) })
        .locator("input")
        .first();
      const loginInput = dlg
        .locator(".el-form-item")
        .filter({ has: dlg.locator(".el-form-item__label").filter({ hasText: /^Login password$/i }) })
        .locator('input[type="password"]')
        .first();
      const confirmInput = dlg
        .locator(".el-form-item")
        .filter({ has: dlg.locator(".el-form-item__label").filter({ hasText: /^Confirm password$/i }) })
        .locator('input[type="password"]')
        .first();

      await typeInto(accountInput, username);
      await typeInto(loginInput, password);
      await typeInto(confirmInput, password);
      await clickDialogButton(dlg, /^\s*save\s*$/i);
      return { ok: true };
    } catch (err) {
      log("create", `locator fill failed (${err instanceof Error ? err.message : err})`);
    }
  }

  const labels = (await findCreateInputsByLabel(page)).map((f) => f.label).join(", ");
  return {
    ok: false,
    error: labels
      ? `create form fields found (${labels}) but fill failed`
      : "create dialog not found",
  };
}

/* ----------------------------------------------------------- user listing */

const NEW_ACCOUNT_RE = /new\s*account/i;

function newAccountLocators(root: Page | Frame): Locator[] {
  return [
    root.getByRole("button", { name: NEW_ACCOUNT_RE }),
    root.locator(".el-button").filter({ hasText: NEW_ACCOUNT_RE }),
    root.locator("button").filter({ hasText: NEW_ACCOUNT_RE }),
    root.getByText(NEW_ACCOUNT_RE),
  ];
}

/** Click via bounding box — works when CDP reports elements as not "visible". */
async function clickLocatorByBox(page: Page, loc: Locator): Promise<boolean> {
  if ((await loc.count()) === 0) return false;
  const box = await loc.first().boundingBox().catch(() => null);
  if (box && box.width > 0 && box.height > 0) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    return true;
  }
  await loc.first().click({ force: true, timeout: 5000 }).catch(() => {});
  return true;
}

async function clickNewAccountInFrame(page: Page, frame: Page | Frame): Promise<boolean> {
  for (const loc of newAccountLocators(frame)) {
    if (await clickLocatorByBox(page, loc.first())) return true;
  }
  return false;
}

async function clickNewAccountViaDom(page: Page, frame: Page | Frame): Promise<boolean> {
  return frame
    .evaluate(() => {
      const norm = (s: string) => s.replace(/\s+/g, " ").trim();
      const candidates = [...document.querySelectorAll("button, .el-button, a, span, div")];
      for (const el of candidates) {
        if (!/^new account$/i.test(norm(el.textContent ?? ""))) continue;
        const clickEl = (el.closest("button, .el-button, a") ?? el) as HTMLElement;
        clickEl.click();
        return true;
      }
      return false;
    })
    .catch(() => false);
}

async function hasNewAccountButton(page: Page): Promise<boolean> {
  await page.bringToFront().catch(() => {});
  for (const frame of page.frames()) {
    for (const loc of newAccountLocators(frame)) {
      if ((await loc.count()) > 0) return true;
    }
    const inDom = await frame
      .evaluate(() =>
        [...document.querySelectorAll("button, .el-button, a, span")].some((el) =>
          /new\s*account/i.test((el.textContent ?? "").replace(/\s+/g, " "))
        )
      )
      .catch(() => false);
    if (inDom) return true;
  }
  return false;
}

async function clickNewAccount(page: Page): Promise<void> {
  await page.bringToFront().catch(() => {});
  await page.waitForTimeout(600);

  for (const frame of page.frames()) {
    if (await clickNewAccountInFrame(page, frame)) {
      log("create", `clicked New Account (${frame.url() || "main"})`);
      return;
    }
    if (await clickNewAccountViaDom(page, frame)) {
      log("create", `clicked New Account via DOM (${frame.url() || "main"})`);
      return;
    }
  }

  await screenshot(page, "new-account-not-found");
  throw new Error("New Account button not found — stay on User List in bot Chrome on /admin");
}

async function isUserListReady(page: Page): Promise<boolean> {
  return hasNewAccountButton(page);
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

  const ready = await hasNewAccountButton(page);
  if (ready) {
    log("nav", "User List ready");
    return;
  }

  if (/cashfrenzy777\.com\/admin/i.test(page.url()) && !(await isLoginPage(page))) {
    log("nav", "on /admin — will click New Account by coordinates");
    return;
  }

  await screenshot(page, "user-list-nav-failed");
  throw new Error("Not logged in on /admin. Open User List in bot Chrome, then retry.");
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

async function accountExistsInList(page: Page, account: string): Promise<boolean> {
  try {
    await searchAccount(page, account);
    if (await accountRow(page, account).isVisible().catch(() => false)) return true;
  } catch {
    /* search UI not visible — try DOM */
  }

  for (const frame of page.frames()) {
    const found = await frame
      .evaluate((term) => {
        const walk = (doc: Document): boolean => {
          for (const cell of doc.querySelectorAll(".el-table__body-wrapper td .cell, .el-table__body td")) {
            if (cell.textContent?.trim() === term) return true;
          }
          for (const iframe of doc.querySelectorAll("iframe")) {
            try {
              const inner = iframe.contentDocument;
              if (inner && walk(inner)) return true;
            } catch {
              /* cross-origin */
            }
          }
          return false;
        };
        return walk(document);
      }, account)
      .catch(() => false);
    if (found) return true;
  }
  return false;
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
  await closeOverlays(page);
  await clickNewAccount(page);
  log("create", `opening create dialog for ${username}`);

  await page.waitForTimeout(3000);

  const filled = await fillAndSaveCreateDialog(page, username, password);
  if (!filled.ok) {
    await screenshot(page, "create-fill-failed");
    return { status: "error", message: filled.error ?? "Could not fill create form" };
  }
  log("create", `filled Account=${username}, password+confirm, clicked Save`);

  await page.waitForTimeout(2500);
  const messages = await readPanelMessages(page);

  await closeOverlays(page);
  await page.waitForTimeout(1500);

  if (await accountExistsInList(page, username)) {
    log("create", `verified ${username} in User List`);
    return { status: "created" };
  }

  if (DUPLICATE_RE.test(messages)) {
    log("create", `username ${username} already exists (${messages})`);
    return { status: "duplicate" };
  }

  await screenshot(page, "create-not-in-list");
  return {
    status: "error",
    message:
      messages ||
      `Account "${username}" not found in User List after Save — form may not have submitted correctly`,
  };
}

export async function createAccount(
  page: Page,
  baseUsername: string,
  password: string,
  variant: (base: string, attempt: number) => string
): Promise<{ username: string; password: string }> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const username = variant(baseUsername, attempt);

    if (await accountExistsInList(page, username)) {
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
