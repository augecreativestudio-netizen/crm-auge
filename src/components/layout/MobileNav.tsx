"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";
import type { Usuario } from "@/lib/types/database";

export function MobileNav({ usuario }: { usuario: Usuario }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-auge-green transition hover:bg-auge-beige-dark"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* drawer */}
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col overflow-y-auto bg-card px-4 py-6 shadow-xl">
            <div className="mb-8 flex items-start justify-between gap-2">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex flex-col gap-1.5">
                <Image
                  src="/auge-logo.png"
                  alt="Auge Creative Studio"
                  width={3824}
                  height={1130}
                  className="h-auto w-40"
                  priority
                />
                <p className="text-[11px] uppercase tracking-wide text-auge-green/50">
                  {usuario.papel === "admin" ? "Administrador" : "Comercial"}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-auge-green/60 hover:bg-auge-beige-dark"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-auge-green text-auge-beige"
                        : "text-auge-green/80 hover:bg-auge-beige-dark"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
