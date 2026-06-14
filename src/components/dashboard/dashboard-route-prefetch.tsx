"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/messages",
  "/dashboard/deposit",
  "/dashboard/deposits",
  "/dashboard/tasks",
  "/dashboard/vip",
  "/dashboard/referrals",
  "/dashboard/reviews",
  "/spin",
];

/** Warm all dashboard routes as soon as the shell mounts. */
export function DashboardRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const href of DASHBOARD_ROUTES) {
      router.prefetch(href);
    }
  }, [router]);

  return null;
}
