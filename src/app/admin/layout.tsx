import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminRoutePrefetch } from "@/components/admin/admin-route-prefetch";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { getAuthUser, getProfile } from "@/lib/supabase/session";
import AdminLoading from "./loading";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <AdminRoutePrefetch />
      <DashboardNav isAdmin />
      <main className="flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-auto">
        <Suspense fallback={<AdminLoading />}>{children}</Suspense>
      </main>
    </div>
  );
}
