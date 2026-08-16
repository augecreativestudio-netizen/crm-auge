"use client";

import { useTransition } from "react";
import Link from "next/link";
import { isPast, isToday, format } from "date-fns";
import { toggleFollowup } from "@/app/(dashboard)/leads/actions";
import { cn } from "@/lib/utils";
import type { Followup } from "@/lib/types/database";

export type FollowupComLead = Followup & { lead_nome: string };

export function DashboardFollowups({
  followups,
  emptyMessage = "Nada pendente por aqui. 🎉",
}: {
  followups: FollowupComLead[];
  emptyMessage?: string;
}) {
  const [, startTransition] = useTransition();

  if (followups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-auge-green/40">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {followups.map((f) => {
        const due = new Date(f.data_prevista + "T00:00:00");
        const overdue = isPast(due) && !isToday(due);

        return (
          <li
            key={f.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm",
              overdue && "border-red-300 bg-red-50"
            )}
          >
            <input
              type="checkbox"
              checked={false}
              onChange={(e) =>
                startTransition(() => {
                  toggleFollowup(f.lead_id, f.id, e.target.checked);
                })
              }
              className="h-4 w-4 accent-[var(--color-auge-green)]"
            />
            <div className="flex-1">
              <p className="text-auge-green">{f.titulo}</p>
              <Link href={`/leads/${f.lead_id}`} className="text-xs text-auge-brown hover:underline">
                {f.lead_nome}
              </Link>
            </div>
            <span className={cn("text-xs shrink-0", overdue ? "font-semibold text-red-600" : "text-auge-green/50")}>
              {isToday(due) ? "hoje" : format(due, "dd/MM/yyyy")}
              {overdue && " · atrasado"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
