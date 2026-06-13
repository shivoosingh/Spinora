"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TASK_DEFINITIONS } from "@/lib/tasks/definitions";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import type { TaskBoardData } from "@/lib/actions/daily-tasks";

interface DailyTaskPopupProps {
  board: TaskBoardData;
  onClose?: () => void;
}

export function DailyTaskPopup({ board, onClose }: DailyTaskPopupProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    onClose?.();
  }

  const activeTasks = TASK_DEFINITIONS.filter((t) => t.level === board.activeLevel);
  const pendingCount = board.submissions.filter((s) => s.status === "pending").length;
  const availableCount = activeTasks.length;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/80"
        onClick={handleClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-3 top-[6dvh] bottom-[6dvh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[101] flex flex-col rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-task-title"
      >
        <div className="relative px-5 pt-8 pb-4 text-center border-b border-white/10 bg-gradient-to-b from-[#1f1f1f] to-[#1a1a1a] shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            aria-label="Close daily tasks"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Target className="h-7 w-7 text-orange-400" />
          </div>
          <h2 id="daily-task-title" className="text-xl font-bold text-white">
            Daily Tasks
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Complete tasks, earn points & unlock real cash rewards
          </p>
          <p className="text-sm text-amber-400 font-semibold mt-2">
            Level {board.activeLevel} active · ${board.availableCashBalance} to claim · $
            {board.totalCashEarned} earned
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {isMobile ? (
            <div className="rounded-xl border border-orange-500/20 bg-[#161616] p-4 space-y-3">
              <p className="text-sm text-white">
                You have <strong className="text-amber-400">{availableCount} tasks</strong> at
                Level {board.activeLevel}. Complete them to earn cash rewards.
              </p>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-400">
                  {pendingCount} submission{pendingCount > 1 ? "s" : ""} awaiting review
                </p>
              )}
              <Link
                href="/dashboard/tasks"
                onClick={handleClose}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-white hover:border-orange-500/40 transition-colors"
              >
                Open full task board
                <ChevronRight className="h-4 w-4 text-orange-400" />
              </Link>
            </div>
          ) : (
            activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} board={board} compact />
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button asChild className="flex-1">
            <Link href="/dashboard/tasks" onClick={handleClose}>
              View all levels & tasks
            </Link>
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
