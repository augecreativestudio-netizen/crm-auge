"use client";

import { useTransition } from "react";
import { isPast, isToday, format } from "date-fns";
import { toggleFollowup } from "@/app/(dashboard)/leads/actions";
import { cn } from "@/lib/utils";
import type { Followup } from "@/lib/types/database";

export function FollowupList({ leadId, followups }: { leadId: string; followups: Followup[] }) {
  const [, startTransition] = useTransition();

  if (followups.length === 0) {
    return <p className="text-sm text-auge-green/40">Nenhum follow-up agendado.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {followups.map((f) => {
        const due = new Date(f.data_prevista + "T00:00:00");
        const overdue = !f.concluido && isPast(due) && !isToday(due);

        return (
          <li
            key={f.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm",
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
            <span className={cn("flex-1", f.concluido && "text-auge-green/40 line-through")}>
              {f.titulo}
            </span>
            <span className={cn("text-xs", overdue ? "font-semibold text-red-600" : "text-auge-green/50")}>
              {format(due, "dd/MM/yyyy")}
              {overdue && " · atrasado"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
