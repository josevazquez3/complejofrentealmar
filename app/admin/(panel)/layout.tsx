import { AdminShell } from "@/components/admin/AdminShell";
import { getInventarioStats, getPendingReservasCount, getTesoreriaStats } from "@/lib/queries";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingReservas, invStats, tesStats] = await Promise.all([
    getPendingReservasCount(),
    getInventarioStats(),
    getTesoreriaStats(),
  ]);

  return (
    <AdminShell
      pendingReservas={pendingReservas}
      inventarioStockBajo={invStats.itemsStockBajo}
      tesoreriaBalanceNegativo={tesStats.balance < 0}
    >
      {children}
    </AdminShell>
  );
}
