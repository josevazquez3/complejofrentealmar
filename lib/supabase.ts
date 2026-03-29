/**
 * Punto de entrada del cliente Supabase (App Router).
 * @see lib/supabase/client.ts — navegador
 * @see lib/supabase/server.ts — servidor
 */
export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createServerClient } from "./supabase/server";
