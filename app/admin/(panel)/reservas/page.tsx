import { ReservasAdminClient } from "@/components/admin/reservas/ReservasAdminClient";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getCasasActivas, getConfiguracion, getReservasAdminPage } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import type { Casa, EstadoReserva, ReservaAdmin } from "@/types";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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

  const [{ rows, total, pageSize }, casas, kpiRowsRaw, rawConfig] = await Promise.all([
    getReservasAdminPage(page),
    getCasasActivas(),
    prisma.reserva.findMany({ select: { estado: true, fechaDesde: true } }),
    getConfiguracion(),
  ]);
  const cfg = mergeConfigWithFallback(rawConfig);

  const hoy = new Date().toISOString().split("T")[0];
  const list = kpiRowsRaw.map((r) => ({
    estado: r.estado as EstadoReserva | null,
    fecha_desde: ymd(r.fechaDesde),
  }));
  const pendientes = list.filter((r) => (r.estado ?? "pendiente") === "pendiente").length;
  const confirmadas = list.filter((r) => r.estado === "confirmada").length;
  const canceladas = list.filter((r) => r.estado === "cancelada").length;
  const proximas = list.filter((r) => r.estado === "confirmada" && r.fecha_desde >= hoy).length;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const casasTyped = casas as Casa[];
  const reservas = (rows ?? []) as unknown as ReservaAdmin[];

  return (
    <ReservasAdminClient
      reservas={reservas}
      casasActivas={casasTyped}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      kpis={{ pendientes, confirmadas, canceladas, proximas }}
      initialEstado={initialEstado}
      configuracionCompleta={cfg}
      whatsappE164={cfg.whatsapp_e164 ?? ""}
      whatsappMensaje={cfg.whatsapp_mensaje}
      nombreComplejo={cfg.complejo_nombre}
    />
  );
}
