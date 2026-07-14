/**
 * Spinora marketing/newsletter emails — promo campaigns via Resend.
 */

import { SITE_NAME, SITE_URL } from "@/lib/constants";

const BG = "#060606";
const SURFACE = "#0f1115";
const GOLD = "#f5c542";
const GOLD_BRIGHT = "#ffd86b";
const GOLD_DEEP = "#d99a1b";
const GREEN = "#00d084";
const TEXT = "#f4f1ea";
const MUTED = "#a8a29a";
const BORDER = "rgba(255,255,255,0.08)";

interface Stat {
  value: string;
  label: string;
}

interface NewsletterOpts {
  eyebrow: string;
  heading: string;
  subhead: string;
  body: string;
  stats?: Stat[];
  cta: { label: string; href: string };
  promoCode?: string;
}

function newsletterShell(opts: NewsletterOpts) {
  const preheader = opts.subhead || opts.heading;
  const statsRow = opts.stats?.length
    ? `<tr><td style="padding:0 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${opts.stats
              .map(
                (s) => `<td align="center" style="padding:12px 4px;background:${BG};border:1px solid ${BORDER};border-radius:12px;">
                  <p style="margin:0;font-size:20px;font-weight:800;color:${GOLD};">${s.value}</p>
                  <p style="margin:2px 0 0;font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">${s.label}</p>
                </td>`
              )
              .join(`<td width="8"></td>`)}
          </tr>
        </table>
      </td></tr>`
    : "";

  const promoRow = opts.promoCode
    ? `<tr><td style="padding:0 32px 24px;" align="center">
        <span style="display:inline-block;border:1px dashed ${GOLD_DEEP};color:${GOLD_BRIGHT};font-weight:800;letter-spacing:0.1em;padding:8px 20px;border-radius:10px;font-size:14px;">${opts.promoCode}</span>
      </td></tr>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
  </head>
  <body style="margin:0;padding:0;background:${BG};color:${TEXT};font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 32px 0;">
            <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:${GOLD};">Spinora</p>
          </td></tr>
          <tr><td style="padding:20px 32px 0;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${GREEN};">${opts.eyebrow}</p>
          </td></tr>
          <tr><td style="padding:8px 32px 0;">
            <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:${TEXT};">${opts.heading}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 20px;">
            <p style="margin:0;font-size:15px;color:${MUTED};">${opts.subhead}</p>
          </td></tr>
          ${statsRow}
          <tr><td style="padding:0 32px 24px;">
            <div style="font-size:15px;line-height:1.6;color:${MUTED};">${opts.body}</div>
          </td></tr>
          ${promoRow}
          <tr><td style="padding:0 32px 32px;" align="center">
            <a href="${opts.cta.href}" style="display:inline-block;background:linear-gradient(135deg,${GOLD_BRIGHT},${GOLD_DEEP});color:#1a1405;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">${opts.cta.label}</a>
          </td></tr>
          <tr><td style="padding:24px 32px;border-top:1px solid ${BORDER};">
            <p style="margin:0;font-size:12px;color:${MUTED};">You're receiving this because you have a ${SITE_NAME} account. <a href="${SITE_URL}/dashboard/settings" style="color:${MUTED};">Manage email preferences</a> or reply with "unsubscribe".</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:${MUTED};">© ${new Date().getFullYear()} ${SITE_NAME} · ${SITE_URL.replace(/^https?:\/\//, "")}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function welcomeBonusNewsletter(opts: { siteUrl: string }) {
  return {
    subject: "Your $2 or $3 Free Play is waiting (eligible players)",
    html: newsletterShell({
      eyebrow: "New Member Offer — USA Players",
      heading: "Free Play is here.",
      subhead: "Claim your $2 or $3 Free Play, plus a 20% deposit bonus.",
      stats: [
        { value: "$2-3", label: "Free Play" },
        { value: "20%", label: "Deposit Bonus" },
        { value: "24/7", label: "Support" },
      ],
      body: "Eligible players get Free Play credited straight to their account, and every deposit on top earns a 20% bonus. Instant credit, fast cashouts, no catches.",
      cta: { label: "Claim Free Play", href: `${opts.siteUrl}/deposit` },
    }),
  };
}

export function happyHourNewsletter(opts: { siteUrl: string }) {
  return {
    subject: "Happy Hour: +20% extra on deposit, right now",
    html: newsletterShell({
      eyebrow: "Happy Hour — Limited Time",
      heading: "Happy Hour is on.",
      subhead: "Deposit now and get 20% extra, on top of your usual bonus.",
      stats: [
        { value: "+20%", label: "Extra On Deposit" },
        { value: "Ltd", label: "Time Only" },
        { value: "Instant", label: "Credit" },
      ],
      body: "For a limited time, every deposit gets an extra 20% on top — your favorite games are waiting. Load up before Happy Hour ends.",
      cta: { label: "Deposit Now", href: `${opts.siteUrl}/deposit` },
    }),
  };
}

export function vipClimbNewsletter(opts: { siteUrl: string; tierName: string }) {
  return {
    subject: `${opts.tierName} VIP is closer than you think`,
    html: newsletterShell({
      eyebrow: "VIP Progression",
      heading: `${opts.tierName} unlocks richer rewards.`,
      subhead: "Your next tier is one good session away.",
      stats: [
        { value: "1.1x-2x", label: "Reward Mult" },
        { value: "5", label: "Tiers" },
        { value: "1", label: "Concierge" },
      ],
      body: "Every coin you earn pushes you toward your next VIP tier — reward multipliers scale up to 2x at the top tier, plus priority support along the way. Check your progress and see exactly what's left to unlock.",
      cta: { label: "View VIP Progress", href: `${opts.siteUrl}/dashboard/vip` },
    }),
  };
}

export function referralBoostNewsletter(opts: { siteUrl: string }) {
  return {
    subject: "Invite friends, earn 40% referral rewards",
    html: newsletterShell({
      eyebrow: "Referral Program",
      heading: "Your friends are worth real coins.",
      subhead: "Invite friends and earn 40% referral rewards — the more friends, the more rewards.",
      stats: [
        { value: "40%", label: "Referral Reward" },
        { value: "∞", label: "Unlimited Invites" },
        { value: "Instant", label: "Credit" },
      ],
      body: "Every friend who signs up with your code and qualifies earns you 40% in referral rewards — no limit on how many. Your personal link is ready whenever you are.",
      cta: { label: "Get My Referral Link", href: `${opts.siteUrl}/dashboard/referrals` },
    }),
  };
}

export function trendingGameNewsletter(opts: { siteUrl: string; gameName: string; gameSlug: string }) {
  return {
    subject: `${opts.gameName} is trending right now`,
    html: newsletterShell({
      eyebrow: "Player Favorite",
      heading: `${opts.gameName} is trending right now.`,
      subhead: "Check out what other players can't stop playing.",
      stats: [
        { value: "Hot", label: "Right Now" },
        { value: "20%", label: "Deposit Bonus" },
        { value: "24/7", label: "Support" },
      ],
      body: `${opts.gameName} is one of today's most-played titles. Load credits and get your 20% deposit bonus while you're at it.`,
      cta: { label: "Play It Now", href: `${opts.siteUrl}/games/${opts.gameSlug}` },
    }),
  };
}

export function leaderboardPrizeNewsletter(opts: { siteUrl: string; prizePool: string }) {
  return {
    subject: `${opts.prizePool} leaderboard prize pool is live`,
    html: newsletterShell({
      eyebrow: "Weekly Leaderboard",
      heading: `${opts.prizePool} up for grabs this week.`,
      subhead: "Climb the board, bank the prize.",
      stats: [
        { value: "Top 10", label: "Paid Out" },
        { value: "7 Days", label: "Duration" },
        { value: "Live", label: "Rankings" },
      ],
      body: "The weekly leaderboard resets every Monday and the prize pool is bigger than ever. Every coin you earn counts toward your rank — check where you stand right now.",
      cta: { label: "View Leaderboard", href: `${opts.siteUrl}/leaderboard` },
    }),
  };
}

export function depositLoyaltyNewsletter(opts: { siteUrl: string }) {
  return {
    subject: "Deposit 5 times, get 1 Free Play",
    html: newsletterShell({
      eyebrow: "Loyalty Reward",
      heading: "Stack your deposits, stack your wins.",
      subhead: "Deposit 5 times and get 1 Free Play on the house.",
      stats: [
        { value: "5", label: "Deposits" },
        { value: "1", label: "Free Play" },
        { value: "20%", label: "Deposit Bonus" },
      ],
      body: "Every deposit already earns a 20% bonus — hit 5 deposits and we add a Free Play on top, automatically. No forms, no tracking required.",
      cta: { label: "View My Wallet", href: `${opts.siteUrl}/dashboard/wallet` },
    }),
  };
}

export function birthdayRewardNewsletter(opts: { siteUrl: string; displayName: string }) {
  return {
    subject: `Happy birthday, ${opts.displayName} — a gift is waiting`,
    html: newsletterShell({
      eyebrow: "Birthday Reward",
      heading: `Happy birthday, ${opts.displayName}.`,
      subhead: "A gift from the whole WinSweeps table.",
      stats: [
        { value: "🎁", label: "Bonus" },
        { value: "7 Days", label: "To Claim" },
        { value: "You", label: "Guest of Honor" },
      ],
      body: "We don't let birthdays pass quietly. Your reward is sitting in the vault, ready whenever you are — claim it before the week's out.",
      cta: { label: "Claim Birthday Gift", href: `${opts.siteUrl}/dashboard/rewards` },
    }),
  };
}

export function winBackNewsletter(opts: { siteUrl: string; displayName: string }) {
  return {
    subject: "We kept your seat warm",
    html: newsletterShell({
      eyebrow: "We Miss You",
      heading: `Come back, ${opts.displayName} — the table's still yours.`,
      subhead: "Happy Hour is on: +20% extra on your next deposit.",
      stats: [
        { value: "+20%", label: "Happy Hour Extra" },
        { value: "Ltd", label: "Time Only" },
        { value: "0", label: "Strings Attached" },
      ],
      body: "Your streak's paused, not gone. Log back in this week and Happy Hour adds 20% extra to your next deposit — plus your VIP progress is exactly where you left it.",
      cta: { label: "Reclaim My Bonus", href: `${opts.siteUrl}/deposit` },
    }),
  };
}

export function seasonalHolidayNewsletter(opts: { siteUrl: string; seasonName: string }) {
  return {
    subject: `${opts.seasonName}: $2/$3 Free Play + 20% deposit bonus`,
    html: newsletterShell({
      eyebrow: `${opts.seasonName} Event`,
      heading: `${opts.seasonName} rewards are live.`,
      subhead: "Free Play plus a deposit bonus, for a limited time.",
      stats: [
        { value: "$2-3", label: "Free Play" },
        { value: "20%", label: "Deposit Bonus" },
        { value: "Ltd", label: "Time Only" },
      ],
      body: `To mark ${opts.seasonName}, eligible players get Free Play credited to their account, plus the usual 20% deposit bonus on top. Once the event ends, so does the offer.`,
      cta: { label: "Join The Event", href: `${opts.siteUrl}/promotions` },
    }),
  };
}

/**
 * Renders a fully admin-authored campaign (subject + all shell fields
 * supplied at call time) — the counterpart to the themed functions above,
 * used by the admin Newsletters section so staff aren't limited to the 10
 * built-in themes.
 */
export function customCampaignEmail(opts: {
  subject: string;
  eyebrow: string;
  heading: string;
  subhead: string;
  body: string;
  stats?: Stat[];
  cta: { label: string; href: string };
}) {
  return {
    subject: opts.subject,
    html: newsletterShell({
      eyebrow: opts.eyebrow,
      heading: opts.heading,
      subhead: opts.subhead,
      body: opts.body,
      stats: opts.stats,
      cta: opts.cta,
    }),
  };
}
