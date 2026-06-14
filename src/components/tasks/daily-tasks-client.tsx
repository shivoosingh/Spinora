"use client";

import { useEffect, useState } from "react";
import { Target, Trophy, HelpCircle, Lock, Gift, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/task-card";
import { TASK_DEFINITIONS, TASK_FAQ, TASK_LEVELS } from "@/lib/tasks/definitions";
import { getLevelUnlockInfo } from "@/lib/tasks/utils";
import { claimLevelReward, type TaskBoardData } from "@/lib/actions/daily-tasks";
import { WALLET_REFRESH_EVENT } from "@/lib/wallet/use-live-wallet";
import { cn } from "@/lib/utils";

type Tab = "active" | "rewards" | "faq";

interface DailyTasksClientProps {
  board: TaskBoardData;
  onReload?: () => void | Promise<void>;
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function DailyTasksClient({ board, onReload }: DailyTasksClientProps) {
  const [tab, setTab] = useState<Tab>("active");
  const [selectedLevel, setSelectedLevel] = useState(board.activeLevel);
  const [claiming, setClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null
  );
  // Re-render once a minute so unlock countdowns stay fresh.
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "active", label: "Active", icon: Target },
    { id: "rewards", label: "Rewards Won", icon: Trophy },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  const levelMeta = TASK_LEVELS.find((l) => l.level === selectedLevel);
  const levelTasks = TASK_DEFINITIONS.filter((t) => t.level === selectedLevel);
  const levelStat = board.levelProgress.find((p) => p.level === selectedLevel);

  const completedLevels = board.levelProgress.filter(
    (p) => p.status === "completed" && p.reward_granted
  );

  const canClaim = levelStat?.status === "completed" && !levelStat?.reward_granted;
  const unlockInfo = getLevelUnlockInfo(selectedLevel, board.levelProgress);

  // Lowest level whose tasks are all approved but the reward isn't claimed yet.
  const claimableLevel = [...board.levelProgress]
    .sort((a, b) => a.level - b.level)
    .find((p) => p.status === "completed" && !p.reward_granted);
  const claimableMeta = claimableLevel
    ? TASK_LEVELS.find((l) => l.level === claimableLevel.level)
    : undefined;

  async function handleClaim(level: number) {
    setClaiming(true);
    setClaimFeedback(null);
    try {
      const result = await claimLevelReward(level);
      if (result.error) {
        const message = result.error;
        setClaimFeedback({ type: "error", message });
        toast.error(message);
        return;
      }
      const message = `$${result.amount} added to your Bonus wallet!`;
      setClaimFeedback({ type: "success", message });
      toast.success(message);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(WALLET_REFRESH_EVENT));
      }
      await onReload?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not claim reward";
      setClaimFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1f1f1f] to-[#141414] p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-20">
          <Target className="h-24 w-24 text-orange-500" />
        </div>
        <div className="max-w-xs mx-auto mb-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
            <p
              className={cn(
                "text-3xl sm:text-4xl font-bold mb-1",
                board.availableCashBalance > 0 ? "text-emerald-400" : "text-white"
              )}
            >
              ${board.availableCashBalance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Available to Claim</p>
            {board.availableCashBalance > 0 && (
              <p className="text-[11px] text-emerald-300/80 mt-1">Press Claim Reward below</p>
            )}
          </div>
        </div>
        <p className="text-xs text-amber-400">{board.totalPointsEarned} total points earned</p>

        {claimableLevel && claimableMeta && (
          <div className="relative mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <Gift className="h-5 w-5" />
                <span>
                  Level {claimableLevel.level} complete — claim your ${claimableMeta.cashReward} reward!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleClaim(claimableLevel.level)}
                disabled={claiming}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Claim Reward
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/70 mt-2">
              Goes to your Bonus wallet. Next level unlocks 24h after you claim.
            </p>
            {claimFeedback && (
              <p
                className={cn(
                  "text-sm font-medium mt-3",
                  claimFeedback.type === "error" ? "text-red-400" : "text-emerald-300"
                )}
              >
                {claimFeedback.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-6 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-2",
              tab === id ? "text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {tab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {TASK_LEVELS.map((lvl) => {
              const stat = board.levelProgress.find((p) => p.level === lvl.level);
              const isLocked = stat?.status === "locked";
              const isActive = stat?.status === "active";
              const isDone = stat?.status === "completed";
              const isClaimable = isDone && !stat?.reward_granted;
              const unlockInfoForLevel = getLevelUnlockInfo(lvl.level, board.levelProgress);
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.level)}
                  className={cn(
                    "shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5",
                    selectedLevel === lvl.level
                      ? "border-orange-500/50 bg-orange-500/10 text-white"
                      : "border-white/10 bg-[#161616] text-muted-foreground hover:text-white",
                    isLocked && "opacity-50"
                  )}
                >
                  {isLocked && <Lock className="h-3 w-3" />}
                  L{lvl.level}
                  {isActive && !isClaimable && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                  {isClaimable && <Gift className="h-3 w-3 text-emerald-400" />}
                  {isDone && !isClaimable && <span className="text-emerald-400">✓</span>}
                  {isLocked && unlockInfoForLevel.waiting && (
                    <Clock className="h-3 w-3 text-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {levelMeta && (
            <div className="mb-4 rounded-xl border border-white/10 bg-[#161616] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-lg">
                    Level {levelMeta.level}: {levelMeta.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">{levelMeta.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">${levelMeta.cashReward} reward</p>
                  <p className="text-[10px] text-muted-foreground">{levelMeta.pointsRequired} pts required</p>
                </div>
              </div>
              {levelStat?.status === "locked" && (() => {
                const prev = board.levelProgress.find((p) => p.level === selectedLevel - 1);
                if (prev?.status === "completed" && !prev.reward_granted) {
                  return (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Claim your Level {selectedLevel - 1} reward to unlock this level
                    </p>
                  );
                }
                if (unlockInfo.waiting) {
                  return (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Unlocks in {formatCountdown(unlockInfo.msRemaining)} — one level every 24 hours
                    </p>
                  );
                }
                return (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Complete &amp; claim Level {selectedLevel - 1} to unlock these tasks
                  </p>
                );
              })()}

              {canClaim && (
                <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-200">
                      <Gift className="h-4 w-4" />
                      <span>All tasks approved! Claim your ${levelMeta.cashReward} reward.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClaim(selectedLevel)}
                      disabled={claiming}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
                    >
                      {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                      Claim Reward
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-300/70 mt-2">
                    Reward goes to your Bonus wallet. The next level unlocks 24 hours after you claim.
                  </p>
                </div>
              )}

              {levelStat?.status === "completed" && levelStat?.reward_granted && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Reward claimed — ${levelMeta.cashReward} added to your Bonus wallet
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {levelTasks.map((task) => (
              <TaskCard key={task.id} task={task} board={board} />
            ))}
          </div>
        </>
      )}

      {tab === "rewards" && (
        <div className="space-y-3">
          {completedLevels.length > 0 ? (
            completedLevels.map((lvl) => {
              const meta = TASK_LEVELS.find((l) => l.level === lvl.level);
              return (
                <div
                  key={lvl.level}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">Level {lvl.level}: {meta?.name}</p>
                    <p className="text-xs text-muted-foreground">{lvl.points_earned} points earned</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">${meta?.cashReward}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground rounded-xl border border-white/5 bg-[#161616]">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Complete Level 1 tasks to earn your first cash reward!</p>
            </div>
          )}
        </div>
      )}

      {tab === "faq" && (
        <div className="space-y-3">
          {TASK_FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-white/10 bg-[#161616] p-4">
              <p className="font-semibold text-sm mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
