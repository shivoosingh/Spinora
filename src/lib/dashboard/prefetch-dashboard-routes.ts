"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/messages",
  "/dashboard/vip",
  "/dashboard/referrals",
  "/dashboard/reviews",
  "/dashboard/tasks",
  "/dashboard/deposits",
  "/spin",
];

/** Warm route bundles + RSC payloads so clicks feel instant */
export function usePrefetchDashboardRoutes() {
  const router = useRouter();

  useEffect(() => {
    for (const href of DASHBOARD_ROUTES) {
      router.prefetch(href);
    }
  }, [router]);
}
