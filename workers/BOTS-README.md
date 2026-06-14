# Spinora game bots — start all & health check

## Quick start

### Option A — One Chrome, 8 tabs (recommended — one taskbar icon)

1. **`start-unified-chrome.bat`** — one Chrome window, 8 tabs (port 9222)
2. Log in on each tab (VPN on for Juwa tab)
3. **`start-all-bots-unified.bat`** — all bots share that Chrome; each uses its own tab

### Option B — Eight separate Chrome windows (original)

1. **`check-all-bots.bat`** — verify `.env`, `node_modules`, Chrome ports
2. **`start-all-chrome.bat`** — open 8 Chrome profiles (ports 9222–9229)
3. Log in on each agent panel (VPN on Juwa)
4. **`start-all-bots.bat`** — start all 8 bot pollers in separate cmd windows

Or run **`start-all.bat`** for the full guided flow (Option B).

## Bot status (code audit)

| Game | Folder | Port | Create | Load | Redeem | Balance | UI type |
|------|--------|------|--------|------|--------|---------|---------|
| Juwa | `juwa-bot` | 9222 | ✅ | ✅ | ✅ | ✅ | Opens https://ht.juwa777.com/login — VPN required |
| Vegas Sweeps | `vegas-bot` | 9223 | ✅ | ✅ | ✅ | ✅ | Opens https://agent.lasvegassweeps.com/login |
| Game Vault | `gamevault-bot` | 9224 | ✅ | ✅ | ✅ | ✅ | Element |
| Gameroom | `gameroom-bot` | 9225 | ✅ | ✅ | ✅ | ✅ | Layui |
| Cash Machine | `cashmachine-bot` | 9226 | ✅ | ✅ | ✅ | ✅ | Layui |
| MR All-in-One | `mr-all-in-one-bot` | 9227 | ✅ | ✅ | ✅ | ✅ | Layui |
| Mafia | `mafia-bot` | 9228 | ✅ | ✅ | ✅ | ✅ | Layui |
| Cash Frenzy | `cash-frenzy-bot` | 9229 | ✅ | ✅ | ✅ | ✅ | Layui iframes |

**Runtime note:** TypeScript strict checks may warn on Supabase client types; bots run via `tsx` and work in production when Chrome is logged in.

**Live panel test:** Queue a $1 load or create-account on the website for each game to confirm end-to-end.

## 24/7 operation

- Leave all Chrome + bot cmd windows open
- **Power settings:** never sleep when plugged in
- Sessions may expire — re-login if jobs fail with login errors
- ~8 Chrome instances use several GB RAM

## Per-game manual start

Each `workers/<game>-bot/` folder still has `start-chrome-for-bot.bat` and `start-bot.bat` for single-game use.
