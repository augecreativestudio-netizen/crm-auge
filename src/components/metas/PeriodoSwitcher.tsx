"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PeriodoSwitcher({ periodoAtual }: { periodoAtual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="month"
      value={periodoAtual}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Selecionar período"
      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
    />
  );
}
