import { AdminShell } from "@/components/admin/AdminShell";
import { getInventarioStats, getTesoreriaStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [{ count }, invStats, tesStats] = await Promise.all([
    supabase
      .from("reservas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    getInventarioStats(),
    getTesoreriaStats(),
  ]);

  return (
    <AdminShell
      pendingReservas={count ?? 0}
      inventarioStockBajo={invStats.itemsStockBajo}
      tesoreriaBalanceNegativo={tesStats.balance < 0}
    >
      {children}
    </AdminShell>
  );
}
