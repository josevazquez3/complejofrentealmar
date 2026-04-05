import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { canAccessUsuariosModule } from "@/lib/roles";
import { getInventarioStats, getPendingReservasCount, getTesoreriaStats } from "@/lib/queries";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /** Evita 500 en el layout si auth o Prisma fallan puntualmente (BD caída, cliente Prisma, etc.). */
  const settled = await Promise.allSettled([
    auth(),
    getPendingReservasCount(),
    getInventarioStats(),
    getTesoreriaStats(),
  ]);

  const session = settled[0].status === "fulfilled" ? settled[0].value : null;
  if (settled[0].status === "rejected" && process.env.NODE_ENV === "development") {
    console.error("[admin layout] auth()", settled[0].reason);
  }

  const pendingReservas =
    settled[1].status === "fulfilled" ? settled[1].value : 0;
  if (settled[1].status === "rejected" && process.env.NODE_ENV === "development") {
    console.error("[admin layout] getPendingReservasCount", settled[1].reason);
  }

  const invStats =
    settled[2].status === "fulfilled"
      ? settled[2].value
      : { itemsStockBajo: 0, totalItems: 0, itemsMalEstado: 0, totalCasas: 0 };
  if (settled[2].status === "rejected" && process.env.NODE_ENV === "development") {
    console.error("[admin layout] getInventarioStats", settled[2].reason);
  }

  const tesStats =
    settled[3].status === "fulfilled"
      ? settled[3].value
      : {
          totalIngresos: 0,
          totalEgresos: 0,
          balance: 0,
          cantMovimientos: 0,
          ingresosMes: 0,
          egresosMes: 0,
          balanceMes: 0,
        };
  if (settled[3].status === "rejected" && process.env.NODE_ENV === "development") {
    console.error("[admin layout] getTesoreriaStats", settled[3].reason);
  }

  const balance = Number(tesStats.balance);
  const tesoreriaBalanceNegativo = Number.isFinite(balance) && balance < 0;

  const rol = session?.user?.rol;
  const showUsuariosNav = canAccessUsuariosModule(rol);

  return (
    <AdminShell
      pendingReservas={pendingReservas}
      inventarioStockBajo={invStats.itemsStockBajo}
      tesoreriaBalanceNegativo={tesoreriaBalanceNegativo}
      showUsuariosNav={showUsuariosNav}
    >
      {children}
    </AdminShell>
  );
}
