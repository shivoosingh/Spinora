import { getTaskById } from "@/lib/tasks/definitions";
import type { TaskSubmission, UserLevelProgress } from "@/lib/tasks/types";

/** A level unlocks this many hours after the previous level's reward is claimed. */
export const TASK_UNLOCK_HOURS = 24;

function getLevelStatus(level: number, progress: UserLevelProgress[]) {
  return progress.find((p) => p.level === level)?.status ?? "locked";
}

/**
 * For a locked level, work out whether the previous level's reward has been
 * claimed and, if so, when this level becomes available (claim time + 24h).
 */
export function getLevelUnlockInfo(
  level: number,
  levelProgress: UserLevelProgress[]
): { unlocksAt: Date | null; msRemaining: number; waiting: boolean } {
  if (level <= 1) return { unlocksAt: null, msRemaining: 0, waiting: false };

  const prev = levelProgress.find((p) => p.level === level - 1);
  if (!prev?.reward_granted || !prev.reward_claimed_at) {
    return { unlocksAt: null, msRemaining: 0, waiting: false };
  }

  const unlocksAt = new Date(
    new Date(prev.reward_claimed_at).getTime() + TASK_UNLOCK_HOURS * 60 * 60 * 1000
  );
  const msRemaining = unlocksAt.getTime() - Date.now();
  return { unlocksAt, msRemaining, waiting: msRemaining > 0 };
}

export function isTaskUnlocked(
  taskId: string,
  levelProgress: UserLevelProgress[],
  submissions: TaskSubmission[]
): { unlocked: boolean; reason?: string; status?: "available" | "pending" | "approved" | "rejected" | "locked" } {
  const task = getTaskById(taskId);
  if (!task) return { unlocked: false, reason: "Task not found", status: "locked" };

  const levelStat = getLevelStatus(task.level, levelProgress);
  if (levelStat === "locked") {
    return { unlocked: false, reason: `Complete Level ${task.level - 1} first`, status: "locked" };
  }

  const existing = submissions.find((s) => s.task_id === taskId);
  if (existing?.status === "approved") {
    return { unlocked: false, reason: "Completed", status: "approved" };
  }
  if (existing?.status === "pending") {
    return { unlocked: false, reason: "Awaiting admin review", status: "pending" };
  }
  if (existing?.status === "rejected") {
    return { unlocked: true, reason: "Resubmit with better proof", status: "rejected" };
  }

  if (levelStat === "completed") {
    return { unlocked: false, reason: "Level completed", status: "locked" };
  }

  return { unlocked: true, status: "available" };
}

export function getLevelTaskProgress(
  level: number,
  submissions: TaskSubmission[],
  taskCount: number
) {
  const approved = submissions.filter(
    (s) => s.level === level && s.status === "approved"
  ).length;
  return { approved, total: taskCount, percent: taskCount ? Math.round((approved / taskCount) * 100) : 0 };
}
