"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type TesoreriaFormState = { ok: boolean; message?: string };

export async function upsertTesoreria(form: {
  id?: string;
  casa_id: string | null;
  reserva_id: string | null;
  diferencia: number | null;
  saldo: number | null;
  comprobante_url: string | null;
}): Promise<TesoreriaFormState> {
  const data = {
    casaId: form.casa_id || null,
    reservaId: form.reserva_id || null,
    diferencia: form.diferencia,
    saldo: form.saldo,
    comprobanteUrl: form.comprobante_url,
  };
  try {
    if (form.id) {
      await prisma.tesoreriaLegacy.update({
        where: { id: form.id },
        data,
      });
    } else {
      await prisma.tesoreriaLegacy.create({ data });
    }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error al guardar." };
  }
  revalidatePath("/admin/tesoreria");
  return { ok: true };
}

export async function deleteTesoreria(id: string): Promise<TesoreriaFormState> {
  try {
    await prisma.tesoreriaLegacy.delete({ where: { id } });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error al eliminar." };
  }
  revalidatePath("/admin/tesoreria");
  return { ok: true };
}
