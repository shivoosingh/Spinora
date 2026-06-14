import { createClient } from "@/lib/supabase/server";
import {
  AdminTransactionsList,
  type AdminTransactionRow,
} from "@/components/admin/admin-transactions-list";

export default async function AdminTransactionsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("wallet_transactions")
    .select(
      "id, amount, wallet_type, transaction_type, source, description, created_at, user:profiles!wallet_transactions_user_id_fkey(id, full_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const transactions = (data ?? []).map((row) => ({
    ...row,
    user: row.user as AdminTransactionRow["user"],
  })) as AdminTransactionRow[];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Every wallet transaction — bonus loads, redeems, admin grants, spin prizes, and more.
          Use <strong className="text-foreground font-medium">Bonus Wallet</strong> to see users who
          loaded games with bonus balance.
        </p>
      </div>

      <AdminTransactionsList transactions={transactions} />
    </div>
  );
}
