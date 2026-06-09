"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, MessageCircle, Menu } from "lucide-react";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { createClient } from "@/lib/supabase/client";

interface HomeHeaderProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
}

export function HomeHeader({ onSearchClick, onMenuClick }: HomeHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { count: unreadMessages } = useUnreadMessages();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 overflow-visible">
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <AnimatedLogo
          textClassName="inline-flex text-xs sm:text-xl"
          imageSize={28}
          className="min-w-0 overflow-hidden [&_img]:sm:w-9 [&_img]:sm:h-9"
          href={isLoggedIn ? "/" : "/"}
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onSearchClick}
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 hover:opacity-90 transition-opacity shrink-0"
          aria-label="Search games"
        >
          <Search className="h-5 w-5" />
        </button>

        {isLoggedIn && (
          <NotificationDropdown buttonClassName="w-9 h-9 sm:w-10 sm:h-10" />
        )}

        {isLoggedIn ? (
          <>
            <Link
              href="/support"
              className="inline-flex px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 text-[10px] sm:text-sm font-bold hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap"
            >
              Deposit
            </Link>
            <UserAccountMenu compact />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-white transition-colors px-2 shrink-0"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap"
            >
              Sign Up
            </Link>
          </>
        )}

        <Link
          href={isLoggedIn ? "/dashboard/messages" : "/support"}
          className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors shrink-0"
          aria-label="Messages and live chat support"
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          {isLoggedIn && unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1">
              <UnreadBadge count={unreadMessages} className="ring-2 ring-[#121212]" />
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
