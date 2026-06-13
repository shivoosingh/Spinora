import { TASK_LEVELS, getTasksForLevel } from "@/lib/tasks/definitions";
import { TASK_UNLOCK_HOURS } from "@/lib/tasks/utils";
import type { LevelStatus, TaskSubmission, UserLevelProgress } from "@/lib/tasks/types";

/** Mark levels completed in-memory when all tasks are approved but DB wasn't updated yet. */
export function inferLevelCompletionFromSubmissions(
  progress: UserLevelProgress[],
  submissions: TaskSubmission[]
): UserLevelProgress[] {
  return progress.map((row) => {
    if (row.status === "completed" || row.reward_granted) return row;

    const levelMeta = TASK_LEVELS.find((l) => l.level === row.level);
    if (!levelMeta) return row;

    const levelTasks = getTasksForLevel(row.level);
    const approved = submissions.filter(
      (s) => s.level === row.level && s.status === "approved"
    );
    const approvedIds = new Set(approved.map((s) => s.task_id));
    const allDone = levelTasks.every((t) => approvedIds.has(t.id));
    const points = approved.reduce((sum, s) => sum + s.points_awarded, 0);

    if (allDone && points >= levelMeta.pointsRequired) {
      return { ...row, status: "completed" as LevelStatus };
    }

    return row;
  });
}

export function computeTaskCashBalances(progress: UserLevelProgress[]) {
  let totalCashEarned = 0;
  let availableCashBalance = 0;

  for (const row of progress) {
    const reward = TASK_LEVELS.find((t) => t.level === row.level)?.cashReward ?? 0;
    if (row.reward_granted) {
      totalCashEarned += reward;
    } else if (row.status === "completed") {
      availableCashBalance += reward;
    }
  }

  return { totalCashEarned, availableCashBalance };
}

/** Enforce claim-first + 24h rules even if DB still has the old auto-unlock function. */
export function normalizeLevelProgress(progress: UserLevelProgress[]): UserLevelProgress[] {
  const sorted = [...progress].sort((a, b) => a.level - b.level);

  return sorted.map((row) => {
    if (row.level === 1) {
      if (row.status === "completed" || row.reward_granted) return row;
      return row.status === "locked" ? { ...row, status: "active" as LevelStatus } : row;
    }

    const prev = sorted.find((p) => p.level === row.level - 1);
    if (!prev) return { ...row, status: "locked" as LevelStatus };

    if (prev.status !== "completed" || !prev.reward_granted) {
      return { ...row, status: "locked" as LevelStatus };
    }

    if (!prev.reward_claimed_at) {
      return { ...row, status: "locked" as LevelStatus };
    }

    const unlockAt =
      new Date(prev.reward_claimed_at).getTime() + TASK_UNLOCK_HOURS * 60 * 60 * 1000;
    if (Date.now() < unlockAt) {
      return { ...row, status: "locked" as LevelStatus };
    }

    if (row.status === "completed" || row.reward_granted) return row;
    if (row.status === "locked") return { ...row, status: "active" as LevelStatus };
    return row;
  });
}

/** Which level tab to highlight: claim pending, active work, or next locked countdown. */
export function resolveActiveLevel(progress: UserLevelProgress[]): number {
  const normalized = normalizeLevelProgress(progress);

  const needsClaim = normalized.find((p) => p.status === "completed" && !p.reward_granted);
  if (needsClaim) return needsClaim.level;

  const active = normalized.find((p) => p.status === "active");
  if (active) return active.level;

  const lastClaimed = [...normalized]
    .reverse()
    .find((p) => p.status === "completed" && p.reward_granted);
  if (lastClaimed && lastClaimed.level < 10) {
    return lastClaimed.level + 1;
  }

  return 1;
}
