"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { isPast, isToday, format } from "date-fns";
import { toggleFollowup, updateFollowup } from "@/app/(dashboard)/leads/actions";
import { cn } from "@/lib/utils";
import type { Followup } from "@/lib/types/database";

export function FollowupList({
  leadId,
  followups,
  emptyMessage = "Nada agendado.",
}: {
  leadId: string;
  followups: Followup[];
  emptyMessage?: string;
}) {
  if (followups.length === 0) {
    return <p className="text-sm text-auge-green/40">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {followups.map((f) => (
        <FollowupRow key={f.id} leadId={leadId} followup={f} />
      ))}
    </ul>
  );
}

function FollowupRow({ leadId, followup: f }: { leadId: string; followup: Followup }) {
  const [editando, setEditando] = useState(false);
  const [, startTransition] = useTransition();
  const [pendingSave, startSaveTransition] = useTransition();

  const due = new Date(f.data_prevista + "T00:00:00");
  const overdue = !f.concluido && isPast(due) && !isToday(due);

  if (editando) {
    return (
      <li className="rounded-lg border border-auge-brown/40 bg-white px-3 py-2">
        <form
          action={(formData) =>
            startSaveTransition(async () => {
              await updateFollowup(leadId, f.id, formData);
              setEditando(false);
            })
          }
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="titulo"
            defaultValue={f.titulo}
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
          />
          <input
            name="data_prevista"
            type="date"
            defaultValue={f.data_prevista}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
          />
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={pendingSave}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-auge-green/60 hover:bg-auge-beige-dark"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pendingSave}
            className="rounded-lg bg-auge-green px-2.5 py-1.5 text-xs font-semibold text-auge-beige hover:bg-auge-green-light disabled:opacity-60"
          >
            {pendingSave ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm",
        overdue && "border-red-300 bg-red-50"
      )}
    >
      <input
        type="checkbox"
        checked={f.concluido}
        onChange={(e) =>
          startTransition(() => {
            toggleFollowup(leadId, f.id, e.target.checked);
          })
        }
        className="h-4 w-4 accent-[var(--color-auge-green)]"
      />
      <span className={cn("flex-1", f.concluido && "text-auge-green/40 line-through")}>{f.titulo}</span>
      <span className={cn("text-xs", overdue ? "font-semibold text-red-600" : "text-auge-green/50")}>
        {format(due, "dd/MM/yyyy")}
        {overdue && " · atrasado"}
      </span>
      <button
        type="button"
        onClick={() => setEditando(true)}
        title="Editar"
        className="text-auge-green/30 opacity-0 transition group-hover:opacity-100 hover:text-auge-brown"
      >
        <Pencil size={14} />
      </button>
    </li>
  );
}
