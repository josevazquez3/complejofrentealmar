import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

/**
 * Devuelve el usuario autenticado en el servidor (o null).
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
