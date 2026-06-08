"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { sendAdminMessage } from "@/lib/actions/admin";
import { uploadChatAttachment } from "@/lib/chat/attachments";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
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

export function AdminChatInbox({ conversations: initialConversations }: AdminChatInboxProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const selected = conversations.find((c) => c.id === selectedId);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!supabase) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", (await supabase.auth.getUser()).data.user?.id ?? "");
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    if (!selectedId || !supabase) return;
    loadMessages(selectedId);

    const channel = supabase
      .channel(`admin-inbox-${selectedId}`)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  if (conversations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No customer chats yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          When customers use the live chat widget on the website, their conversations will appear here so you can reply in real time.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[70vh]">
        <div
          className={cn(
            "border-r border-border flex flex-col",
            mobileChatOpen ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Customers</h2>
            <p className="text-xs text-muted-foreground">{conversations.length} active chat(s)</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => {
              const user = conv.user;
              const isActive = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    isActive ? "bg-primary/20 border border-primary/30" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        user?.is_online ? "bg-green-400" : "bg-gray-500"
                      )}
                    />
                    <span className="font-medium text-sm truncate">
                      {user?.full_name || "Customer"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatRelativeTime(conv.updated_at)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "md:col-span-2 flex flex-col",
            !mobileChatOpen ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileChatOpen(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">
                {selected?.user?.full_name || "Customer"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {selected?.user?.email}
              </p>
            </div>
            <Badge variant="success">Live</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Send a reply to start the conversation.
              </p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender_id === adminId;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-2 text-sm",
                        isAdmin
                          ? "gradient-bg text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {!isAdmin && (
                        <p className="text-[10px] font-semibold opacity-70 mb-0.5">Customer</p>
                      )}
                      <ChatMessageContent message={msg} />
                      <p className="text-[10px] opacity-60 mt-1">
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
            disabled={!selectedId}
            placeholder="Type your reply to the customer..."
            showSendLabel
          />
        </div>
      </div>
    </Card>
  );
}
