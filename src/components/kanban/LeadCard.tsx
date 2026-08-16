"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import { Building2, User } from "lucide-react";
import { origemLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadCliente } from "@/lib/types/database";

export type LeadComRelacoes = LeadCliente & {
  responsavel_nome?: string | null;
};

export function LeadCard({ lead }: { lead: LeadComRelacoes }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group cursor-grab touch-none rounded-xl border border-border bg-card p-3 shadow-sm transition active:cursor-grabbing",
        isDragging && "z-50 opacity-60 shadow-lg"
      )}
    >
      <Link
        href={`/leads/${lead.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="block"
      >
        <p className="text-sm font-semibold text-auge-green">{lead.nome}</p>
        {lead.empresa && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-auge-green/60">
            <Building2 size={12} /> {lead.empresa}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-auge-beige-dark px-2 py-0.5 text-[10px] font-medium text-auge-green/80">
            {origemLabel(lead.origem)}
          </span>
        </div>
        {lead.responsavel_nome && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-auge-brown">
            <User size={11} /> {lead.responsavel_nome}
          </p>
        )}
      </Link>
    </div>
  );
}
