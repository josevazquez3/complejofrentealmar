"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_COMPLEX_NAME } from "@/lib/constants";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Credenciales inválidas");
        return;
      }
      toast.success("Bienvenido");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      toast.error(`No se pudo conectar: ${detail}`);
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
