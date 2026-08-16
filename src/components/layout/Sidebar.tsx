"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";
import type { Usuario } from "@/lib/types/database";

export function Sidebar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card/60 px-4 py-6 md:flex">
      <Link href="/dashboard" className="mb-8 flex flex-col gap-1.5 px-2">
        <Image
          src="/auge-logo.png"
          alt="Auge Creative Studio"
          width={3824}
          height={1130}
          className="h-auto w-full"
          priority
        />
        <p className="text-[11px] uppercase tracking-wide text-auge-green/50">
          {usuario.papel === "admin" ? "Administrador" : "Comercial"}
        </p>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
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
    </aside>
  );
}
