export type TaskSubmissionStatus = "pending" | "approved" | "rejected";
export type LevelStatus = "locked" | "active" | "completed";

export interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  level: number;
  status: TaskSubmissionStatus;
  proof_note: string | null;
  proof_url: string | null;
  points_awarded: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserLevelProgress {
  user_id: string;
  level: number;
  status: LevelStatus;
  points_earned: number;
  reward_granted: boolean;
  completed_at: string | null;
  reward_claimed_at: string | null;
}
