import { createClient } from "@/lib/supabase/server";
import { AdminUsersList } from "@/components/admin/admin-users-list";

const USER_COLUMNS =
  "id, full_name, email, phone, whatsapp, role, is_suspended, vip_tier, vip_points, wallet_balance, bonus_wallet, cashout_wallet, bonus_redeem_wallet, created_at";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Search users, manage roles, and start conversations
        </p>
      </div>

      <AdminUsersList users={users ?? []} />
    </div>
  );
}
