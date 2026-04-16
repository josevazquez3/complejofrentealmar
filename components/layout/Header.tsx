"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, evitarOptimizadorNextImage } from "@/lib/utils";
import { useConfiguracion } from "@/hooks/useConfiguracion";

const nav = [
  { href: "/", label: "HOME", match: (p: string, h: string) => p === "/" && !h },
  {
    href: "/#unidades",
    label: "UNIDADES",
    match: (p: string, h: string) => h === "unidades" || p.startsWith("/casas"),
  },
  {
    href: "/reservas",
    label: "RESERVAS",
    match: (p: string, h: string) => {
      void h;
      return p === "/reservas";
    },
  },
  {
    href: "/#equipamiento",
    label: "EQUIPAMIENTO",
    match: (p: string, h: string) => h === "equipamiento",
  },
  {
    href: "/#servicios",
    label: "SERVICIOS",
    match: (p: string, h: string) => h === "servicios",
  },
  {
    href: "/#contacto",
    label: "CONTACTO",
    match: (p: string, h: string) => h === "contacto",
  },
] as const;

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 12c4 0 4-6 8-6s4 6 8 6 4-6 8-6 4 6 8 6 4-6 8-6 4 6 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  const config = useConfiguracion();
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);

  const fb = config.facebook_url?.trim() || "https://facebook.com";
  const ig = config.instagram_url?.trim() || "https://instagram.com";
  const logoUrl = config.logo_url?.trim() ?? "";

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full border-b border-fm-border bg-white shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="relative flex items-center justify-between px-8 py-4">
        <Link href="/" className="group flex items-center gap-3">
          {logoUrl ? (
            <span className="relative h-11 w-[140px] shrink-0 sm:w-[160px]">
              <Image
                src={logoUrl}
                alt={config.complejo_nombre}
                fill
                className="object-contain object-left"
                sizes="160px"
                priority
                unoptimized={evitarOptimizadorNextImage(logoUrl)}
              />
            </span>
          ) : (
            <>
              <span className="font-display text-3xl font-bold leading-none text-fm-red">FM</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-widest text-fm-text">
                  FRENTE AL MAR
                </span>
              </div>
              <WaveIcon className="h-4 w-10 text-fm-red/80 transition-colors group-hover:text-fm-red" />
            </>
          )}
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 lg:flex">
          {nav.map((item) => {
            const active = item.match(pathname, hash);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest transition-colors duration-300",
                  active ? "text-fm-red" : "text-fm-nav hover:text-fm-red"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 lg:gap-4">
          <Link
            href="/admin/login"
            className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-fm-nav transition-colors duration-300 hover:text-fm-red sm:text-xs lg:tracking-widest"
          >
            Ingresar
          </Link>
          <a
            href={fb}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-fm-red text-fm-red transition-colors duration-300 hover:bg-fm-red hover:text-white"
          >
            <FaFacebookF className="h-4 w-4" />
          </a>
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-fm-red text-fm-red transition-colors duration-300 hover:bg-fm-red hover:text-white"
          >
            <FaInstagram className="h-4 w-4" />
          </a>

          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-fm-text hover:bg-fm-border/40 lg:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-nav-sheet"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menú</span>
            </Button>
            <SheetContent side="right" className="border-fm-border bg-white" id="mobile-nav-sheet">
              <SheetHeader>
                <SheetTitle className="text-left font-display text-fm-red">FM FRENTE AL MAR</SheetTitle>
              </SheetHeader>
              <nav className="mt-10 flex flex-col gap-6">
                {nav.map((item) => {
                  const active = item.match(pathname, hash);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "text-sm font-semibold uppercase tracking-widest transition-colors",
                        active ? "text-fm-red" : "text-fm-nav hover:text-fm-red"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/admin/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4 border-fm-red/40 text-fm-text hover:bg-fm-red/5 hover:text-fm-red"
                  )}
                >
                  Ingresar
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
