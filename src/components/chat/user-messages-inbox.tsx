"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { uploadChatAttachment } from "@/lib/chat/attachments";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { UnreadBadge } from "@/components/ui/unread-badge";
import {
  ensureUserConversation,
  markConversationRead,
  sendUserMessage,
} from "@/lib/actions/messages";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Headphones, MessageCircle } from "lucide-react";
import type { Message } from "@/types/database";

function messagePreview(msg: Message) {
  if (msg.content.trim()) return msg.content;
  if (msg.attachment_type === "image") return "Sent an image";
  if (msg.attachment_type === "file") return "Sent a file";
  return "Sent a message";
}

export function UserMessagesInbox() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [lastPreview, setLastPreview] = useState("Start a conversation with our team");
  const [lastTime, setLastTime] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessages();

  const loadMessages = useCallback(
    async (convId: string, currentUserId: string) => {
      if (!supabase) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      const list = data ?? [];
      setMessages(list);

      if (list.length > 0) {
        const last = list[list.length - 1];
        setLastPreview(messagePreview(last));
        setLastTime(last.created_at);
      }

      await markConversationRead(convId);
      refreshUnread();
    },
    [supabase, refreshUnread]
  );

  const init = useCallback(async () => {
    if (!supabase) {
      setInitLoading(false);
      return;
    }

    setInitLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setInitLoading(false);
      return;
    }

    setUserId(user.id);

    const result = await ensureUserConversation();
    if ("error" in result) {
      toast.error(result.error);
      setInitLoading(false);
      return;
    }

    setConversationId(result.conversationId);
    await loadMessages(result.conversationId, user.id);
    setInitLoading(false);
  }, [supabase, loadMessages]);

  useEffect(() => {
    init();
    setMobileChatOpen(true);
  }, [init]);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    const channel = supabase
      .channel(`user-inbox-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          setLastPreview(messagePreview(msg));
          setLastTime(msg.created_at);

          if (userId && msg.sender_id !== userId && mobileChatOpen) {
            void markConversationRead(conversationId).then(() => refreshUnread());
          } else {
            refreshUnread();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId, mobileChatOpen, refreshUnread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function openChat() {
    setMobileChatOpen(true);
    if (conversationId) {
      void markConversationRead(conversationId).then(() => refreshUnread());
    }
  }

  async function handleSend(file: File | null): Promise<boolean> {
    if ((!input.trim() && !file) || !conversationId) return false;
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
      const uploadResult = await uploadChatAttachment(supabase, conversationId, file);
      if ("error" in uploadResult) {
        toast.error(uploadResult.error);
        setInput(content);
        setLoading(false);
        return false;
      }
      attachment = uploadResult.data;
    }

    const result = await sendUserMessage(conversationId, content, attachment);
    if (result.error) {
      toast.error(result.error);
      setInput(content);
      setLoading(false);
      return false;
    }

    if (conversationId) {
      await loadMessages(conversationId, userId!);
    }
    setLoading(false);
    return true;
  }

  if (initLoading) {
    return (
      <Card className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </Card>
    );
  }

  if (!supabase || !userId) {
    return (
      <Card className="p-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Please log in</h3>
        <p className="text-sm text-muted-foreground">Sign in to message our support team.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-[#161616]">
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[70vh]">
        <div
          className={cn(
            "border-r border-white/10 flex flex-col bg-[#141414]",
            mobileChatOpen ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Chats</h2>
            <p className="text-xs text-muted-foreground">Tap a conversation to open it</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={openChat}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-colors border",
                mobileChatOpen || conversationId
                  ? "bg-white/10 border-orange-500/30"
                  : "border-transparent hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shrink-0">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-white truncate">
                      Spinora Support
                    </span>
                    <UnreadBadge count={unreadCount} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{lastPreview}</p>
                  {lastTime && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatRelativeTime(lastTime)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div
          className={cn(
            "md:col-span-2 flex flex-col min-h-[70vh]",
            !mobileChatOpen ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#121212]">
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-muted-foreground"
              onClick={() => setMobileChatOpen(false)}
              aria-label="Back to chats"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shrink-0">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white truncate">Spinora Support</h2>
              <p className="text-xs text-muted-foreground">We typically reply in minutes</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Live</Badge>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f0f0f] min-h-[280px]"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Say hello to our support team — type below to start chatting.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        isOwn
                          ? "gradient-bg text-white rounded-br-md"
                          : "bg-[#1e1e1e] text-foreground border border-white/5 rounded-bl-md"
                      )}
                    >
                      {!isOwn && (
                        <p className="text-[10px] font-semibold text-orange-400 mb-1">Support</p>
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
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
            disabled={!conversationId}
            placeholder="Type a message..."
            showSendLabel
            className="bg-[#121212] border-white/10"
          />
        </div>
      </div>
    </Card>
  );
}
