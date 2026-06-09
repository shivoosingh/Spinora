"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { sendAdminMessage } from "@/lib/actions/admin";
import { getAdminConversationUnreads, type AdminConversationUnread } from "@/lib/actions/messages";
import { uploadChatAttachment } from "@/lib/chat/attachments";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { MobileChatShell } from "@/components/chat/mobile-chat-shell";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Message } from "@/types/database";

interface ConversationUser {
  full_name?: string | null;
  email?: string;
  is_online?: boolean;
}

export interface AdminConversation {
  id: string;
  user_id: string;
  updated_at: string;
  user: ConversationUser | null;
}

interface AdminChatInboxProps {
  conversations: AdminConversation[];
}

function displayContact(user: ConversationUser | null | undefined) {
  const email = user?.email ?? "";
  if (!email || email.endsWith("@phone.spinora.local")) {
    return user?.full_name ? `${user.full_name} · Phone user` : "Phone user";
  }
  return email;
}

interface AdminChatPanelProps {
  showMobileBack?: boolean;
  onBack?: () => void;
  selected: AdminConversation | undefined;
  messages: Message[];
  adminId: string | null;
  selectedId: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (file: File | null) => Promise<boolean>;
  loading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
}

function AdminChatPanel({
  showMobileBack,
  onBack,
  selected,
  messages,
  adminId,
  selectedId,
  input,
  onInputChange,
  onSend,
  loading,
  scrollRef,
}: AdminChatPanelProps) {
  return (
    <>
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2 sm:gap-3 bg-[#121212] shrink-0">
        {showMobileBack && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onBack}
            aria-label="Back to customers"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate text-white">
            {selected?.user?.full_name || "Customer"}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {displayContact(selected?.user)}
          </p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shrink-0">
          Live
        </Badge>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 pb-4 space-y-3 bg-[#0f0f0f]"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Send a reply to start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isAdminMsg = msg.sender_id === adminId;
            return (
              <div
                key={msg.id}
                className={cn("flex", isAdminMsg ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm break-words",
                    isAdminMsg
                      ? "gradient-bg text-white rounded-br-md"
                      : "bg-[#1e1e1e] text-foreground border border-white/5 rounded-bl-md"
                  )}
                >
                  {!isAdminMsg && (
                    <p className="text-[10px] font-semibold text-orange-400 mb-1">Customer</p>
                  )}
                  <ChatMessageContent message={msg} />
                  <p className="text-[10px] opacity-60 mt-1.5">
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ChatComposer
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        loading={loading}
        disabled={!selectedId}
        placeholder="Type a message..."
        showSendLabel
        className="bg-[#121212] border-white/10"
      />
    </>
  );
}

export function AdminChatInbox({ conversations: initialConversations }: AdminChatInboxProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [unreads, setUnreads] = useState<Record<string, AdminConversationUnread>>({});
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { refresh: refreshGlobalUnread } = useUnreadMessages();

  const selected = conversations.find((c) => c.id === selectedId);

  const loadUnreads = useCallback(async () => {
    const list = await getAdminConversationUnreads();
    const map: Record<string, AdminConversationUnread> = {};
    for (const item of list) {
      map[item.conversationId] = item;
    }
    setUnreads(map);
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!supabase) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user?.id ?? "")
        .eq("is_read", false);

      await loadUnreads();
      await refreshGlobalUnread();
    },
    [supabase, loadUnreads, refreshGlobalUnread]
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
    void loadUnreads();
  }, [supabase, loadUnreads]);

  useEffect(() => {
    if (!supabase || !adminId || conversations.length === 0) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    for (const conv of conversations) {
      const channel = supabase
        .channel(`admin-list-${conv.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conv.id}`,
          },
          (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === adminId) return;
            void loadUnreads();
            if (conv.id === selectedId) {
              setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
              );
              void loadMessages(conv.id);
            }
          }
        )
        .subscribe();
      channels.push(channel);
    }

    return () => {
      for (const ch of channels) supabase.removeChannel(ch);
    };
  }, [conversations, supabase, adminId, selectedId, loadUnreads, loadMessages]);

  useEffect(() => {
    if (!selectedId || !supabase) return;
    loadMessages(selectedId);
  }, [selectedId, supabase, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function selectConversation(id: string) {
    setSelectedId(id);
    setMobileChatOpen(true);
  }

  async function handleSend(file: File | null): Promise<boolean> {
    if ((!input.trim() && !file) || !selectedId) return false;
    if (!supabase) {
      toast.error("Chat is unavailable. Check your connection.");
      return false;
    }

    setLoading(true);
    const content = input.trim();
    setInput("");

    let attachment:
      | { url: string; type: "image" | "file"; name: string }
      | undefined;

    if (file) {
      const uploadResult = await uploadChatAttachment(supabase, selectedId, file);
      if ("error" in uploadResult) {
        toast.error(uploadResult.error);
        setInput(content);
        setLoading(false);
        return false;
      }
      attachment = uploadResult.data;
    }

    const result = await sendAdminMessage(selectedId, content, attachment);
    if (result.error) {
      toast.error(result.error);
      setInput(content);
      setLoading(false);
      return false;
    }

    await loadMessages(selectedId);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, updated_at: new Date().toISOString() } : c
      )
    );
    setLoading(false);
    return true;
  }

  const chatPanelProps = {
    selected,
    messages,
    adminId,
    selectedId,
    input,
    onInputChange: setInput,
    onSend: handleSend,
    loading,
    scrollRef,
  };

  if (conversations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No customer chats yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          When customers message you on the website, their conversations will appear here.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden border-white/10 bg-[#161616]">
        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[60vh] md:min-h-[70vh]">
          <div
            className={cn(
              "border-r border-white/10 flex flex-col bg-[#141414] min-h-[50vh] md:min-h-0",
              mobileChatOpen ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-4 border-b border-white/10 shrink-0">
              <h2 className="font-semibold text-white">Customers</h2>
              <p className="text-xs text-muted-foreground">{conversations.length} active chat(s)</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => {
                const user = conv.user;
                const isActive = conv.id === selectedId;
                const meta = unreads[conv.id];
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-colors border",
                      isActive
                        ? "bg-white/10 border-orange-500/30"
                        : "border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          user?.is_online ? "bg-green-400" : "bg-gray-500"
                        )}
                      />
                      <span className="font-medium text-sm truncate text-white flex-1">
                        {user?.full_name || "Customer"}
                      </span>
                      {meta?.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatRelativeTime(meta.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {meta?.lastMessage ?? displayContact(user)}
                      </p>
                      <UnreadBadge count={meta?.unreadCount ?? 0} />
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                      {displayContact(user)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop chat panel */}
          <div className="hidden md:flex md:col-span-2 flex-col min-h-[70vh] min-h-0 overflow-hidden">
            <AdminChatPanel {...chatPanelProps} />
          </div>
        </div>
      </Card>

      {/* Mobile full-screen chat — portaled to body so composer is never clipped */}
      <MobileChatShell open={mobileChatOpen && !!selectedId}>
        <AdminChatPanel
          {...chatPanelProps}
          showMobileBack
          onBack={() => setMobileChatOpen(false)}
        />
      </MobileChatShell>
    </>
  );
}
