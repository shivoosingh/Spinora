"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/types/database";

function messagePreview(msg: Pick<Message, "content" | "attachment_type">): string {
  if (msg.content.trim()) return msg.content;
  if (msg.attachment_type === "image") return "Sent an image";
  if (msg.attachment_type === "file") return "Sent a file";
  return "Sent a message";
}

export interface ConversationPreview {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export async function getUserConversations(): Promise<ConversationPreview[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, admin_id, updated_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (!conversations?.length) return [];

  const previews: ConversationPreview[] = [];

  for (const conv of conversations) {
    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("content, attachment_type, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    const last = lastMsgs?.[0];
    let adminName = "Support team";

    if (conv.admin_id) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", conv.admin_id)
        .single();
      if (adminProfile?.full_name) adminName = adminProfile.full_name;
    }

    previews.push({
      id: conv.id,
      title: "Spinora Support",
      subtitle: adminName,
      lastMessage: last ? messagePreview(last) : "Start a conversation with our team",
      lastMessageAt: last?.created_at ?? conv.updated_at,
      unreadCount: unreadCount ?? 0,
    });
  }

  return previews;
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!conversations?.length) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in(
      "conversation_id",
      conversations.map((c) => c.id)
    )
    .eq("is_read", false)
    .neq("sender_id", user.id);

  return count ?? 0;
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  revalidatePath("/dashboard/messages");
  return { success: true };
}

export async function sendUserMessage(
  conversationId: string,
  content: string,
  attachment?: {
    url: string;
    type: "image" | "file";
    name: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!content.trim() && !attachment) {
    return { error: "Message cannot be empty" };
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.user_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
    ...(attachment && {
      attachment_url: attachment.url,
      attachment_type: attachment.type,
      attachment_name: attachment.name,
    }),
  });

  if (error) {
    const hint = error.message.includes("attachment_")
      ? " Run supabase/chat-attachments.sql in Supabase SQL Editor first."
      : "";
    return { error: `${error.message}${hint}` };
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/chat");
  return { success: true };
}

export async function ensureUserConversation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!conversation) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id })
      .select("id, updated_at")
      .single();

    if (error) return { error: error.message };
    conversation = created;
  }

  return { conversationId: conversation.id, updatedAt: conversation.updated_at };
}

export interface AdminConversationUnread {
  conversationId: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string | null;
}

export async function getAdminUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return 0;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("is_active", true);

  if (!conversations?.length) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in(
      "conversation_id",
      conversations.map((c) => c.id)
    )
    .eq("is_read", false)
    .neq("sender_id", user.id);

  return count ?? 0;
}

export async function getAdminConversationUnreads(): Promise<AdminConversationUnread[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (!conversations?.length) return [];

  const results: AdminConversationUnread[] = [];

  for (const conv of conversations) {
    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("content, attachment_type, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    const last = lastMsgs?.[0];
    results.push({
      conversationId: conv.id,
      unreadCount: unreadCount ?? 0,
      lastMessage: last ? messagePreview(last) : "No messages yet",
      lastMessageAt: last?.created_at ?? conv.updated_at,
    });
  }

  return results;
}
