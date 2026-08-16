"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { updateInteracao } from "@/app/(dashboard)/leads/actions";
import { TIPOS_INTERACAO } from "@/lib/constants";
import type { Interacao } from "@/lib/types/database";

const TIPO_LABEL: Record<Interacao["tipo"], string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  nota: "Nota",
};

export function InteracaoItem({
  leadId,
  interacao,
  nomeAutor,
}: {
  leadId: string;
  interacao: Interacao;
  nomeAutor: string;
}) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editando) {
    return (
      <li className="rounded-xl border border-auge-brown/40 bg-white p-4 text-sm">
        <form
          action={(formData) =>
            startTransition(async () => {
              await updateInteracao(leadId, interacao.id, formData);
              setEditando(false);
            })
          }
          className="flex flex-col gap-3"
        >
          <div className="flex gap-3">
            <select name="tipo" defaultValue={interacao.tipo} className={inputClass + " w-40"}>
              {TIPOS_INTERACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input name="titulo" defaultValue={interacao.titulo ?? ""} placeholder="Título" className={inputClass + " flex-1"} />
          </div>
          <textarea name="transcricao" defaultValue={interacao.transcricao ?? ""} rows={3} className={inputClass} />
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
    <li className="group rounded-xl border border-border bg-white p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-auge-green">
          {interacao.titulo || TIPO_LABEL[interacao.tipo]} ·{" "}
          <span className="text-auge-green/50">{TIPO_LABEL[interacao.tipo]}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-auge-green/40">
            {format(new Date(interacao.data), "dd/MM/yyyy HH:mm")} · {nomeAutor}
          </span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            title="Editar"
            className="text-auge-green/30 opacity-0 transition group-hover:opacity-100 hover:text-auge-brown"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
      {interacao.transcricao && (
        <p className="mt-2 whitespace-pre-wrap text-auge-green/80">{interacao.transcricao}</p>
      )}
    </li>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";
