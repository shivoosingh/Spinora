"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, MessageCircle, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getAdminUnreadMessageCount,
  getUnreadMessageCount,
} from "@/lib/actions/messages";
import { UnreadBadge } from "@/components/ui/unread-badge";
import type { Message } from "@/types/database";

interface IncomingPopup {
  id: string;
  conversationId: string;
  title: string;
  preview: string;
  isAdminView: boolean;
}

interface MessageRealtimeContextValue {
  count: number;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const MessageRealtimeContext = createContext<MessageRealtimeContextValue>({
  count: 0,
  isAdmin: false,
  refresh: async () => {},
});

function messagePreview(msg: Pick<Message, "content" | "attachment_type">): string {
  if (msg.content.trim()) return msg.content;
  if (msg.attachment_type === "image") return "Sent an image";
  if (msg.attachment_type === "file") return "Sent a file";
  return "Sent you a message";
}

export function MessageRealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [popup, setPopup] = useState<IncomingPopup | null>(null);
  const userIdRef = useRef<string | null>(null);
  const isAdminRef = useRef(false);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      setIsAdmin(false);
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);

    userIdRef.current = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const admin = profile?.role === "admin";
    setIsAdmin(admin);
    isAdminRef.current = admin;

    const total = admin ? await getAdminUnreadMessageCount() : await getUnreadMessageCount();
    setCount(total);
  }, []);

  const showPopup = useCallback(
    async (msg: Message) => {
      const adminView = isAdminRef.current;

      if (adminView && pathname?.startsWith("/admin/chat")) return;
      if (!adminView && pathname?.startsWith("/dashboard/messages")) return;

      let title = adminView ? "New customer message" : "Spinora Support";

      if (adminView) {
        const supabase = createClient();
        if (supabase) {
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", msg.sender_id)
            .single();
          title = sender?.full_name || sender?.email?.split("@")[0] || "Customer";
        }
      }

      setPopup({
        id: msg.id,
        conversationId: msg.conversation_id,
        title,
        preview: messagePreview(msg),
        isAdminView: adminView,
      });

      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      popupTimerRef.current = setTimeout(() => setPopup(null), 8000);
    },
    [pathname]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      userIdRef.current = user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const admin = profile?.role === "admin";
      isAdminRef.current = admin;
      setIsAdmin(admin);

      const query = admin
        ? supabase.from("conversations").select("id").eq("is_active", true)
        : supabase
            .from("conversations")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_active", true);

      const { data: conversations } = await query;
      if (!conversations?.length) return;

      for (const conv of conversations) {
        const channel = supabase
          .channel(`msg-rt-${user.id}-${conv.id}`)
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
              if (msg.sender_id === user.id) return;

              void refresh();
              void showPopup(msg);
            }
          )
          .subscribe();

        channels.push(channel);
      }
    })();

    return () => {
      cancelled = true;
      for (const ch of channels) supabase.removeChannel(ch);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [refresh, showPopup]);

  function openChat() {
    setPopup(null);
    router.push(isAdmin ? "/admin/chat" : "/dashboard/messages");
  }

  const hideFab =
    (isAdmin && pathname?.startsWith("/admin/chat")) ||
    (!isAdmin && pathname?.startsWith("/dashboard/messages"));

  const chatHref = isAdmin ? "/admin/chat" : "/dashboard/messages";

  return (
    <MessageRealtimeContext.Provider value={{ count, isAdmin, refresh }}>
      {children}

      {/* Floating chat button — users & admins */}
      {!hideFab && isLoggedIn && (
        <Link
          href={chatHref}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-lg glow-purple"
          aria-label={isAdmin ? "Open customer chat" : "Open messages"}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5">
              <UnreadBadge count={count} className="ring-2 ring-[#121212]" />
            </span>
          )}
        </Link>
      )}

      <AnimatePresence>
        {popup && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            onClick={openChat}
            className="fixed z-[9998] left-3 right-3 sm:left-auto sm:right-auto sm:w-[320px] bottom-[5.5rem] sm:bottom-6 sm:left-6 flex items-start gap-3 p-3 rounded-2xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-md shadow-2xl shadow-black/50 text-left hover:bg-[#222] transition-colors"
            aria-label="Open chat"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center shrink-0">
              {popup.isAdminView ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Headphones className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-white truncate">{popup.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{popup.preview}</p>
              <p className="text-[10px] text-orange-400 mt-1.5 font-medium">Tap to open chat</p>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setPopup(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setPopup(null);
                }
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </MessageRealtimeContext.Provider>
  );
}

export function useUnreadMessages() {
  return useContext(MessageRealtimeContext);
}
