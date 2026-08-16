"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { LeadCard, type LeadComRelacoes } from "./LeadCard";
import type { EstagioPipeline } from "@/lib/types/database";

export function KanbanColumn({
  estagio,
  label,
  leads,
}: {
  estagio: EstagioPipeline;
  label: string;
  leads: LeadComRelacoes[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio });

  const isClosed = estagio === "fechado_ganho" || estagio === "fechado_perdido";

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-auge-beige-dark/40">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h3
          className={cn(
            "text-sm font-semibold",
            estagio === "fechado_ganho" && "text-emerald-700",
            estagio === "fechado_perdido" && "text-red-700",
            !isClosed && "text-auge-green"
          )}
        >
          {label}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-auge-green/60">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-2xl p-2 transition-colors",
          isOver && "bg-auge-brown/10 ring-2 ring-auge-brown/30"
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-auge-green/30">Sem leads</p>
        )}
      </div>
    </div>
  );
}
