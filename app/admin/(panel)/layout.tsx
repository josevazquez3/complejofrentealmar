import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { canAccessUsuariosModule } from "@/lib/roles";
import { getInventarioStats, getPendingReservasCount, getTesoreriaStats } from "@/lib/queries";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, pendingReservas, invStats, tesStats] = await Promise.all([
    auth(),
    getPendingReservasCount(),
    getInventarioStats(),
    getTesoreriaStats(),
  ]);
  const rol = session?.user?.rol;
  const showUsuariosNav = canAccessUsuariosModule(rol);

  return (
    <AdminShell
      pendingReservas={pendingReservas}
      inventarioStockBajo={invStats.itemsStockBajo}
      tesoreriaBalanceNegativo={tesStats.balance < 0}
      showUsuariosNav={showUsuariosNav}
    >
      {children}
    </AdminShell>
  );
}
