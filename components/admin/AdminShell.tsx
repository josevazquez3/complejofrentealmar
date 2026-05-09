"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  PenLine,
  Users,
  Wallet,
} from "lucide-react";
import { FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, key: undefined, gestoresOnly: false },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: Users,
    key: undefined,
    gestoresOnly: true,
  },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays, key: "reservas" as const, gestoresOnly: false },
  { href: "/admin/casas", label: "Casas", icon: Building2, key: undefined, gestoresOnly: false },
  { href: "/admin/inventario", label: "Inventario", icon: Package, key: "inventario" as const, gestoresOnly: false },
  { href: "/admin/tesoreria", label: "Tesorería", icon: Wallet, key: "tesoreria" as const, gestoresOnly: false },
  { href: "/admin/configuracion", label: "Configuración", icon: FiSettings, key: undefined, gestoresOnly: false },
  { href: "/admin/configuracion/editar", label: "Editar sitio", icon: PenLine, key: undefined, gestoresOnly: false },
] as const;

export function AdminShell({
  children,
  pendingReservas,
  inventarioStockBajo,
  tesoreriaBalanceNegativo,
  showUsuariosNav,
}: {
  children: React.ReactNode;
  pendingReservas: number;
  inventarioStockBajo: number;
  tesoreriaBalanceNegativo: boolean;
  showUsuariosNav: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visibleLinks = links.filter((l) => !l.gestoresOnly || showUsuariosNav);

  async function handleLogout() {
    await signOut({ redirect: false });
    toast.success("Sesión cerrada");
    window.location.href = "/admin/login";
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside
        className={cn(
        "hidden md:sticky md:top-0 md:flex md:h-screen md:flex-col border-r border-nautico-700/50 bg-nautico-900 text-blanco transition-all duration-300",
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
          {visibleLinks.map(({ href, label, icon: Icon, key }) => {
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
      <div className="min-h-screen flex-1 overflow-x-auto bg-blanco p-4 md:p-8 pb-20 md:pb-8">{children}</div>
    {/* Bottom nav — solo mobile */}
<nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-nautico-700/50 bg-nautico-900 px-2 py-2 md:hidden">
  {visibleLinks.slice(0, 5).map(({ href, label, icon: Icon, key }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors",
          active ? "text-arena-400" : "text-blanco/70"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
        {key === "reservas" && pendingReservas > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-yellow-400 px-1 text-[9px] font-bold text-yellow-900">
            {pendingReservas}
          </span>
        )}
        {key === "inventario" && inventarioStockBajo > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-fm-red px-1 text-[9px] font-bold text-white">
            {inventarioStockBajo}
          </span>
        )}
      </Link>
    );
  })}
  {/* Botón logout compacto */}
  <button
    type="button"
    onClick={handleLogout}
    className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-red-300"
  >
    <LogOut className="h-5 w-5" />
    <span>Salir</span>
  </button>
</nav>
    
    </div>
  );
}
