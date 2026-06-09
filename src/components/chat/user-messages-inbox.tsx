"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { uploadChatAttachment } from "@/lib/chat/attachments";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { MobileChatShell } from "@/components/chat/mobile-chat-shell";
import { UnreadBadge } from "@/components/ui/unread-badge";
import {
  ensureUserConversation,
  getUserConversations,
  markConversationRead,
  sendUserMessage,
  type ConversationPreview,
} from "@/lib/actions/messages";
import { useUnreadMessages } from "@/components/chat/message-realtime-provider";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Headphones, MessageCircle } from "lucide-react";
import type { Message } from "@/types/database";

interface UserChatPanelProps {
  showMobileBack?: boolean;
  onBack?: () => void;
  selectedConversation: ConversationPreview | undefined;
  messages: Message[];
  userId: string | null;
  selectedId: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (file: File | null) => Promise<boolean>;
  loading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
}

function UserChatPanel({
  showMobileBack,
  onBack,
  selectedConversation,
  messages,
  userId,
  selectedId,
  input,
  onInputChange,
  onSend,
  loading,
  scrollRef,
}: UserChatPanelProps) {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a chat from the list to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 sm:p-4 border-b border-white/10 flex items-center gap-2 sm:gap-3 bg-[#121212] shrink-0">
        {showMobileBack && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onBack}
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shrink-0">
          <Headphones className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white truncate">{selectedConversation.title}</h2>
          <p className="text-xs text-muted-foreground truncate">{selectedConversation.subtitle}</p>
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
          <div className="text-center py-12">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Say hello — our team typically replies in minutes.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words",
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

export function UserMessagesInbox() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { refresh: refreshUnread } = useUnreadMessages();

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const loadConversations = useCallback(async () => {
    await ensureUserConversation();
    const list = await getUserConversations();
    setConversations(list);
    return list;
  }, []);

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!supabase) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setMessages(data ?? []);
      await markConversationRead(convId);
      await refreshUnread();
      await loadConversations();
    },
    [supabase, refreshUnread, loadConversations]
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
    const list = await loadConversations();

    if (list.length > 0) {
      setSelectedId(list[0].id);
      await loadMessages(list[0].id);
    }

    setInitLoading(false);
  }, [supabase, loadConversations, loadMessages]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!selectedId || !supabase) return;

    const channel = supabase
      .channel(`user-inbox-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

          if (userId && msg.sender_id !== userId) {
            if (mobileChatOpen || window.matchMedia("(min-width: 768px)").matches) {
              void markConversationRead(selectedId).then(() => {
                refreshUnread();
                loadConversations();
              });
            } else {
              refreshUnread();
              loadConversations();
            }
          } else {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, supabase, userId, mobileChatOpen, refreshUnread, loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function selectConversation(convId: string) {
    setSelectedId(convId);
    setMobileChatOpen(true);
    await loadMessages(convId);
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

    const result = await sendUserMessage(selectedId, content, attachment);
    if (result.error) {
      toast.error(result.error);
      setInput(content);
      setLoading(false);
      return false;
    }

    await loadMessages(selectedId);
    setLoading(false);
    return true;
  }

  const chatPanelProps = {
    selectedConversation,
    messages,
    userId,
    selectedId,
    input,
    onInputChange: setInput,
    onSend: handleSend,
    loading,
    scrollRef,
  };

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
              <h2 className="font-semibold text-white">Chats</h2>
              <p className="text-xs text-muted-foreground">Your conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 px-4">
                  No chats yet. Start one with our support team below.
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-colors border",
                      selectedId === conv.id
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
                          <span className="font-semibold text-sm text-white truncate">{conv.title}</span>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate flex-1">{conv.lastMessage}</p>
                          <UnreadBadge count={conv.unreadCount} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Desktop chat panel */}
          <div className="hidden md:flex md:col-span-2 flex-col min-h-[70vh] min-h-0 overflow-hidden">
            <UserChatPanel {...chatPanelProps} />
          </div>
        </div>
      </Card>

      {/* Mobile full-screen chat — portaled to body so composer is never clipped */}
      <MobileChatShell open={mobileChatOpen && !!selectedConversation}>
        <UserChatPanel
          {...chatPanelProps}
          showMobileBack
          onBack={() => setMobileChatOpen(false)}
        />
      </MobileChatShell>
    </>
  );
}
