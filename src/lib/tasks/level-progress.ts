import { TASK_LEVELS, getTasksForLevel } from "@/lib/tasks/definitions";
import { TASK_UNLOCK_HOURS } from "@/lib/tasks/utils";
import type { LevelStatus, TaskSubmission, UserLevelProgress } from "@/lib/tasks/types";

export interface LevelApprovalState {
  totalTasks: number;
  approvedCount: number;
  pendingCount: number;
  pointsApproved: number;
  pointsRequired: number;
  allApproved: boolean;
  readyToClaim: boolean;
}

/** Every task in the level must be admin-approved before reward claim. */
export function getLevelApprovalState(
  level: number,
  submissions: TaskSubmission[]
): LevelApprovalState {
  const levelMeta = TASK_LEVELS.find((l) => l.level === level);
  const levelTasks = getTasksForLevel(level);
  const levelSubs = submissions.filter((s) => s.level === level);
  const approved = levelSubs.filter((s) => s.status === "approved");
  const approvedIds = new Set(approved.map((s) => s.task_id));
  const pointsApproved = approved.reduce((sum, s) => sum + s.points_awarded, 0);
  const pointsRequired = levelMeta?.pointsRequired ?? 0;
  const allApproved = levelTasks.every((t) => approvedIds.has(t.id));
  const pendingCount = levelSubs.filter((s) => s.status === "pending").length;

  return {
    totalTasks: levelTasks.length,
    approvedCount: approved.length,
    pendingCount,
    pointsApproved,
    pointsRequired,
    allApproved,
    readyToClaim: allApproved && pointsApproved >= pointsRequired,
  };
}

export function isLevelReadyToClaim(
  level: number,
  progress: UserLevelProgress[],
  submissions: TaskSubmission[]
): boolean {
  const row = progress.find((p) => p.level === level);
  if (!row || row.reward_granted) return false;
  return getLevelApprovalState(level, submissions).readyToClaim;
}

/** Mark levels completed in-memory when all tasks are approved but DB wasn't updated yet. */
export function inferLevelCompletionFromSubmissions(
  progress: UserLevelProgress[],
  submissions: TaskSubmission[]
): UserLevelProgress[] {
  return progress.map((row) => {
    if (row.reward_granted) return row;

    const approval = getLevelApprovalState(row.level, submissions);

    if (approval.readyToClaim) {
      return { ...row, status: "completed" as LevelStatus };
    }

    // Never trust DB "completed" if admin has not approved every task yet.
    if (row.status === "completed") {
      return { ...row, status: "active" as LevelStatus };
    }

    return row;
  });
}

export function computeTaskCashBalances(
  progress: UserLevelProgress[],
  submissions: TaskSubmission[] = []
) {
  let totalCashEarned = 0;
  let availableCashBalance = 0;

  for (const row of progress) {
    const reward = TASK_LEVELS.find((t) => t.level === row.level)?.cashReward ?? 0;
    if (row.reward_granted) {
      totalCashEarned += reward;
    } else if (isLevelReadyToClaim(row.level, progress, submissions)) {
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
