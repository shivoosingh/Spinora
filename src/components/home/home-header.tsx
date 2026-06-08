"use client";

import Link from "next/link";
import { Search, MessageCircle } from "lucide-react";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface HomeHeaderProps {
  onSearchClick: () => void;
}

export function HomeHeader({ onSearchClick }: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-[#121212]/95 backdrop-blur-md border-b border-white/5">
      <AnimatedLogo textClassName="text-xl" />

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onSearchClick}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 hover:opacity-90 transition-opacity"
          aria-label="Search games"
        >
          <Search className="h-5 w-5" />
        </button>

        <NotificationDropdown />

        <Link
          href="/login"
          className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-white transition-colors px-2"
        >
          Sign In
        </Link>

        <Link
          href="/register"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Sign Up
        </Link>

        <Link
          href="/support"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          aria-label="Live chat support"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
