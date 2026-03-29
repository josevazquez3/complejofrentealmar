"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Wallet,
} from "lucide-react";
import { FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, key: undefined },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays, key: "reservas" as const },
  { href: "/admin/inventario", label: "Inventario", icon: Package, key: "inventario" as const },
  { href: "/admin/tesoreria", label: "Tesorería", icon: Wallet, key: "tesoreria" as const },
  { href: "/admin/configuracion", label: "Configuración", icon: FiSettings, key: undefined },
] as const;

export function AdminShell({
  children,
  pendingReservas,
  inventarioStockBajo,
  tesoreriaBalanceNegativo,
}: {
  children: React.ReactNode;
  pendingReservas: number;
  inventarioStockBajo: number;
  tesoreriaBalanceNegativo: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
    toast.success("Sesión cerrada");
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-nautico-700/50 bg-nautico-900 text-blanco transition-all duration-300",
          collapsed ? "w-[72px]" : "w-56"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
          {!collapsed && (
            <Link href="/admin/dashboard" className="font-display text-lg text-arena-400">
              Admin
            </Link>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-blanco hover:bg-white/10"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {links.map(({ href, label, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-arena-500/20 text-arena-400" : "text-blanco/80 hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {key === "reservas" && pendingReservas > 0 ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        {pendingReservas}
                      </span>
                    ) : null}
                    {key === "inventario" && inventarioStockBajo > 0 ? (
                      <span className="rounded-full bg-fm-red px-2 py-0.5 text-xs font-semibold text-white">
                        {inventarioStockBajo}
                      </span>
                    ) : null}
                    {key === "tesoreria" && tesoreriaBalanceNegativo ? (
                      <span className="rounded-full bg-fm-red px-2 py-0.5 text-xs font-bold text-white">!</span>
                    ) : null}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-2">
          <Link
            href="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blanco/80 hover:bg-white/10"
          >
            <Home className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sitio público</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-950/40"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
      <div className="min-h-screen flex-1 overflow-x-auto bg-blanco p-4 md:p-8">{children}</div>
    </div>
  );
}
