import Link from "next/link";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { getInventarioStats, getTesoreriaStats } from "@/lib/queries";
import { formatMonto } from "@/lib/format-moneda";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const from = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const { count: reservasMes } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .gte("fecha_desde", from)
    .lte("fecha_desde", to);

  const { count: reservasPendientes } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  const { count: casasActivas } = await supabase
    .from("casas")
    .select("*", { count: "exact", head: true })
    .eq("activa", true);

  const invStats = await getInventarioStats();
  const tesStats = await getTesoreriaStats();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-nautico-900">Dashboard</h1>
      <p className="mt-1 text-sm text-nautico-700/80">Resumen del mes en curso</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Reservas (mes)"
          value={reservasMes ?? 0}
          icon="calendar"
          delay={0}
        />
        <Link href="/admin/reservas?estado=pendiente" className="block">
          <DashboardCard
            title="Reservas pendientes"
            value={reservasPendientes ?? 0}
            icon="calendar"
            delay={0.04}
          />
        </Link>
        <DashboardCard
          title="Casas activas"
          value={casasActivas ?? 0}
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
