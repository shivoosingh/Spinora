import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { getAuthUser, getProfile } from "@/lib/supabase/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile?.is_suspended) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <DashboardNav isAdmin={profile?.role === "admin"} />
      <main className="flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-auto relative z-0">
        {children}
      </main>
    </div>
  );
}
