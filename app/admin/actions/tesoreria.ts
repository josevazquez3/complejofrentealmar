"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TesoreriaFormState = { ok: boolean; message?: string };

export async function upsertTesoreria(form: {
  id?: string;
  casa_id: string | null;
  reserva_id: string | null;
  diferencia: number | null;
  saldo: number | null;
  comprobante_url: string | null;
}): Promise<TesoreriaFormState> {
  const supabase = await createClient();
  const row = {
    casa_id: form.casa_id || null,
    reserva_id: form.reserva_id || null,
    diferencia: form.diferencia,
    saldo: form.saldo,
    comprobante_url: form.comprobante_url,
  };
  if (form.id) {
    const { error } = await supabase.from("tesoreria").update(row).eq("id", form.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("tesoreria").insert(row);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/admin/tesoreria");
  return { ok: true };
}

export async function deleteTesoreria(id: string): Promise<TesoreriaFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("tesoreria").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/tesoreria");
  return { ok: true };
}
