"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_COMPLEX_NAME } from "@/lib/constants";
import { env } from "@/lib/env";
import { toast } from "sonner";

const supabaseClienteListo = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseClienteListo) {
      toast.error(
        "Faltan variables de entorno de Supabase en el build. En Vercel: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o ANON_KEY), luego Redeploy."
      );
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Credenciales inválidas" : error.message);
        return;
      }
      toast.success("Bienvenido");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      toast.error(
        detail.includes("Faltan NEXT_PUBLIC") || detail.includes("clave pública")
          ? "Supabase no está configurado en este entorno (revisá Vercel → Environment Variables y hacé un redeploy)."
          : `No se pudo conectar: ${detail}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-nautico-900 via-nautico-800 to-nautico-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <Link href="/" className="block text-center font-display text-2xl text-nautico-900">
          <span className="text-arena-600">{DEFAULT_COMPLEX_NAME}</span>
        </Link>
        <p className="mt-2 text-center text-sm text-nautico-700/75">Panel de administración</p>
        {!supabaseClienteListo ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950"
          >
            <p className="font-semibold">Supabase no está disponible en esta versión desplegada</p>
            <p className="mt-2 text-amber-900/90">
              En <strong>Vercel</strong> → tu proyecto → <strong>Settings → Environment Variables</strong>: definí{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (o{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) con los valores de
              Supabase → Settings → API. Luego <strong>Deployments → Redeploy</strong> (las variables{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_*</code> se inyectan al compilar).
            </p>
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-nautico-800 py-6 text-blanco hover:bg-arena-600 hover:text-nautico-900"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-nautico-600">
          <Link href="/" className="underline-offset-4 hover:text-arena-600 hover:underline">
            Volver al sitio
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
