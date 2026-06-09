export type UserRole = "user" | "admin";
export type VipTier = "bronze" | "silver" | "gold" | "platinum";
export type RequestStatus = "pending" | "processing" | "completed" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRole;
  vip_tier: VipTier;
  vip_points: number;
  wallet_balance: number;
  bonus_wallet: number;
  referral_code: string;
  referred_by: string | null;
  is_suspended: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameRequest {
  id: string;
  user_id: string;
  game_name: string;
  game_provider: string;
  status: RequestStatus;
  notes: string | null;
  admin_notes: string | null;
  credentials: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageAttachmentType = "image" | "file";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: MessageAttachmentType | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "promo";
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "promotion" | "update" | "system";
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_points: number;
  created_at: string;
}
