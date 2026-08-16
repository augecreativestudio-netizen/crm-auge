"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMeta } from "@/app/(dashboard)/metas/actions";
import { tipoMetaLabel, tipoMetaInfo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MetaComRealizado } from "@/lib/metas";

export function MetaCard({
  item,
  responsavelNome,
  isAdmin,
}: {
  item: MetaComRealizado;
  responsavelNome: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { meta, realizado, percentual, formatado } = item;
  const info = tipoMetaInfo(meta.tipo_meta);

  const metaFormatada =
    meta.tipo_meta === "taxa_conversao"
      ? `${meta.valor_meta}%`
      : meta.tipo_meta === "valor_fechado"
        ? meta.valor_meta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : `${meta.valor_meta} ${info.unidade}`;

  const progresso = percentual === null ? 0 : Math.min(100, Math.max(0, percentual));
  const atingiu = percentual !== null && percentual >= 100;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-auge-green">{tipoMetaLabel(meta.tipo_meta)}</p>
          <p className="text-xs text-auge-green/50">{responsavelNome}</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            title="Excluir meta"
            disabled={pending}
            onClick={() => startTransition(() => deleteMeta(meta.id))}
            className="text-auge-green/30 transition hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold text-auge-green">{formatado}</span>
        <span className="text-xs text-auge-green/50">meta: {metaFormatada}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-auge-beige-dark">
        <div
          className={cn("h-full rounded-full transition-all", atingiu ? "bg-emerald-600" : "bg-auge-brown")}
          style={{ width: `${progresso}%` }}
        />
      </div>

      {realizado === null && (
        <p className="text-xs text-auge-green/40">Sem dados suficientes neste período ainda.</p>
      )}
      {percentual !== null && (
        <p className={cn("text-xs font-medium", atingiu ? "text-emerald-700" : "text-auge-green/60")}>
          {percentual.toFixed(0)}% da meta
        </p>
      )}
    </div>
  );
}
