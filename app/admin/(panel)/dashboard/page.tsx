import Link from "next/link";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { getAdminDashboardStats, getInventarioStats, getTesoreriaStats } from "@/lib/queries";
import { formatMonto } from "@/lib/format-moneda";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [{ reservasMes, reservasPendientes, casasActivas }, invStats, tesStats] = await Promise.all([
    getAdminDashboardStats(),
    getInventarioStats(),
    getTesoreriaStats(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-nautico-900">Dashboard</h1>
      <p className="mt-1 text-sm text-nautico-700/80">Resumen del mes en curso</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Reservas (mes)"
          value={reservasMes}
          icon="calendar"
          delay={0}
        />
        <Link href="/admin/reservas?estado=pendiente" className="block">
          <DashboardCard
            title="Reservas pendientes"
            value={reservasPendientes}
            icon="calendar"
            delay={0.04}
          />
        </Link>
        <DashboardCard
          title="Casas activas"
          value={casasActivas}
          icon="home"
          delay={0.08}
        />
        <Link href="/admin/inventario?vista=stockbajo" className="block">
          <DashboardCard
            title="Items con stock bajo"
            value={invStats.itemsStockBajo}
            icon="alert"
            delay={0.12}
          />
        </Link>
        <Link href="/admin/tesoreria" className="block">
          <DashboardCard
            title="Balance del mes"
            value={formatMonto(tesStats.balanceMes)}
            icon="wallet"
            delay={0.16}
            valueClassName={tesStats.balanceMes >= 0 ? "text-green-700" : "text-red-600"}
          />
        </Link>
        <Link href="/admin/tesoreria" className="block">
          <DashboardCard
            title="Ingresos del mes"
            value={formatMonto(tesStats.ingresosMes)}
            icon="trending"
            delay={0.2}
            valueClassName="text-green-700"
          />
        </Link>
      </div>
    </div>
  );
}
