"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Mercado } from "@/lib/types/database";

export function MarketSwitcher({ mercados }: { mercados: Mercado[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("mercado") ?? "todos";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todos") {
      params.delete("mercado");
    } else {
      params.set("mercado", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Filtrar por mercado"
      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
    >
      <option value="todos">Todos os mercados</option>
      {mercados.map((m) => (
        <option key={m.id} value={m.codigo}>
          {m.nome}
        </option>
      ))}
    </select>
  );
}
