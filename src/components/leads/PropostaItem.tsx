"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { updateProposta } from "@/app/(dashboard)/leads/actions";
import type { Proposta } from "@/lib/types/database";

const STATUS_OPTIONS = [
  { value: "enviada", label: "Enviada" },
  { value: "aceita", label: "Aceita" },
  { value: "recusada", label: "Recusada" },
  { value: "expirada", label: "Expirada" },
];

export function PropostaItem({ leadId, proposta }: { leadId: string; proposta: Proposta }) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editando) {
    return (
      <li className="rounded-xl border border-auge-brown/40 bg-white p-4 text-sm">
        <form
          action={(formData) =>
            startTransition(async () => {
              await updateProposta(leadId, proposta.id, formData);
              setEditando(false);
            })
          }
          className="flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-4">
            <input name="valor" type="number" step="0.01" defaultValue={proposta.valor ?? ""} placeholder="Valor" className={inputClass} />
            <input name="moeda" defaultValue={proposta.moeda ?? ""} placeholder="Moeda" className={inputClass} />
            <input name="data_envio" type="date" defaultValue={proposta.data_envio} className={inputClass} />
            <select name="status" defaultValue={proposta.status} className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <input name="link" type="url" defaultValue={proposta.link ?? ""} placeholder="Link" className={inputClass} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={pending}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-auge-green/60 hover:bg-auge-beige-dark"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-auge-green px-3 py-1.5 text-xs font-semibold text-auge-beige hover:bg-auge-green-light disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between rounded-xl border border-border bg-white p-4 text-sm">
      <div>
        <p className="font-medium text-auge-green">
          {proposta.valor ? `${proposta.moeda ?? ""} ${proposta.valor.toLocaleString("pt-BR")}` : "Valor não informado"}
        </p>
        <p className="text-xs text-auge-green/50">
          Enviada em {format(new Date(proposta.data_envio + "T00:00:00"), "dd/MM/yyyy")} · {proposta.status}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {proposta.link && (
          <a href={proposta.link} target="_blank" rel="noreferrer" className="text-sm text-auge-brown hover:underline">
            Ver link
          </a>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          title="Editar"
          className="text-auge-green/30 opacity-0 transition group-hover:opacity-100 hover:text-auge-brown"
        >
          <Pencil size={14} />
        </button>
      </div>
    </li>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";
