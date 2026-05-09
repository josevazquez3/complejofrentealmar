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
  Menu,
  Package,
  PenLine,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, key: undefined, gestoresOnly: false },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, key: undefined, gestoresOnly: true },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleLinks = links.filter((l) => !l.gestoresOnly || showUsuariosNav);

  async function handleLogout() {
    await signOut({ redirect: false });
    toast.success("Sesión cerrada");
    window.location.href = "/admin/login";
  }

  function NavLinks({ onClickLink }: { onClickLink?: () => void }) {
    return (
      <>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {visibleLinks.map(({ href, label, icon: Icon, key }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClickLink}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-arena-500/20 text-arena-400" : "text-blanco/80 hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {key === "reservas" && pendingReservas > 0 && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        {pendingReservas}
                      </span>
                    )}
                    {key === "inventario" && inventarioStockBajo > 0 && (
                      <span className="rounded-full bg-fm-red px-2 py-0.5 text-xs font-semibold text-white">
                        {inventarioStockBajo}
                      </span>
                    )}
                    {key === "tesoreria" && tesoreriaBalanceNegativo && (
                      <span className="rounded-full bg-fm-red px-2 py-0.5 text-xs font-bold text-white">!</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-2">
          <Link
            href="/"
            onClick={onClickLink}
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
      </>
    );
  }

  return (
    <div className="flex min-h-screen">

      {/* Sidebar desktop */}
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
        <NavLinks />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-nautico-700/50 bg-nautico-900 text-blanco">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
              <Link href="/admin/dashboard" className="font-display text-lg text-arena-400">
                Admin
              </Link>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-blanco hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks onClickLink={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-h-screen flex-1 flex-col overflow-x-auto bg-blanco">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-base font-semibold text-nautico-900">Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}