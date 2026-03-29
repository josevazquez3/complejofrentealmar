import { ReservasAdminClient } from "@/components/admin/reservas/ReservasAdminClient";
import { createClient } from "@/lib/supabase/server";
import { getReservasAdminPage } from "@/lib/queries";
import type { Casa, EstadoReserva, ReservaAdmin } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AdminReservasPage({ searchParams }: PageProps) {
  const raw = searchParams.page;
  const pageStr = Array.isArray(raw) ? raw[0] : raw;
  const page = Math.max(1, Number.parseInt(pageStr ?? "1", 10) || 1);
  const rawEstado = searchParams.estado;
  const estadoStr = Array.isArray(rawEstado) ? rawEstado[0] : rawEstado;
  const initialEstado =
    estadoStr === "pendiente" || estadoStr === "confirmada" || estadoStr === "cancelada"
      ? estadoStr
      : "todos";

  const [{ rows, total, pageSize }, supabase] = await Promise.all([
    getReservasAdminPage(page),
    createClient(),
  ]);

  const { data: casasData } = await supabase
    .from("casas")
    .select("*")
    .eq("activa", true)
    .order("nombre");

  const { data: kpiRows } = await supabase.from("reservas").select("estado, fecha_desde");
  const hoy = new Date().toISOString().split("T")[0];
  const list = (kpiRows ?? []) as { estado: EstadoReserva | null; fecha_desde: string }[];
  const pendientes = list.filter((r) => (r.estado ?? "pendiente") === "pendiente").length;
  const confirmadas = list.filter((r) => r.estado === "confirmada").length;
  const canceladas = list.filter((r) => r.estado === "cancelada").length;
  const proximas = list.filter((r) => r.estado === "confirmada" && r.fecha_desde >= hoy).length;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const casas = (casasData ?? []) as Casa[];
  const reservas = (rows ?? []) as unknown as ReservaAdmin[];

  return (
    <ReservasAdminClient
      reservas={reservas}
      casasActivas={casas}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      kpis={{ pendientes, confirmadas, canceladas, proximas }}
      initialEstado={initialEstado}
    />
  );
}
