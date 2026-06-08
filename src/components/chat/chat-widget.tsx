"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { uploadChatAttachment } from "@/lib/chat/attachments";
import { sendUserMessage, markConversationRead } from "@/lib/actions/messages";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Message } from "@/types/database";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadMessages();

  const initChat = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    let { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!conv) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      conv = newConv;
    }

    if (conv) {
      setConversationId(conv.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs);
    }
  }, [supabase]);

  useEffect(() => {
    if (open && supabase) {
      void initChat();
    }
  }, [open, initChat, supabase]);

  useEffect(() => {
    if (open && conversationId) {
      void markConversationRead(conversationId).then(() => refreshUnread());
    }
  }, [open, conversationId, refreshUnread]);

  useEffect(() => {
    if (!conversationId || !supabase) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(file: File | null): Promise<boolean> {
    if ((!input.trim() && !file) || !conversationId || !userId) return false;
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

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (msgs) setMessages(msgs);

    setLoading(false);
    return true;
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 left-auto z-50 w-[calc(100vw-3rem)] max-w-sm sm:w-96 glass rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="gradient-bg px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Live Chat Support</h3>
                <p className="text-xs text-white/70">We typically reply in minutes</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <Minimize2 className="h-4 w-4 text-white" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="h-72 overflow-y-auto p-4 space-y-3">
              {!supabase ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chat unavailable</p>
              ) : !userId ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">Please log in to start chatting</p>
                  <Button size="sm" asChild>
                    <a href="/login">Login</a>
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Start a conversation with our support team!
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.sender_id === userId
                          ? "gradient-bg text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <ChatMessageContent message={msg} />
                      <p className="text-[10px] opacity-60 mt-1">{formatRelativeTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {userId && supabase && (
              <ChatComposer
                value={input}
                onChange={setInput}
                onSend={handleSend}
                loading={loading}
                placeholder="Type a message..."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 left-auto z-50 w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-lg glow-purple"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <UnreadBadge count={unreadCount} className="ring-2 ring-[#121212]" />
          </span>
        )}
      </motion.button>
    </>
  );
}
