import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { MarketSwitcher } from "./MarketSwitcher";
import type { Mercado, Usuario } from "@/lib/types/database";

export function Topbar({ usuario, mercados }: { usuario: Usuario; mercados: Mercado[] }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 md:px-6">
      {/* MarketSwitcher reads useSearchParams, which opts this subtree into
          client-side dynamic rendering — wrap in Suspense per Next.js guidance. */}
      <Suspense fallback={<div className="h-8 w-40" />}>
        <MarketSwitcher mercados={mercados} />
      </Suspense>

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-auge-green">{usuario.nome}</p>
          <p className="text-xs text-auge-green/50">{usuario.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-full text-auge-green/70 transition hover:bg-auge-beige-dark hover:text-auge-green"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
