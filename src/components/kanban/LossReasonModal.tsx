"use client";

import { useState } from "react";
import { MOTIVOS_PERDA } from "@/lib/constants";
import type { MotivoPerdaEnum } from "@/lib/types/database";

export function LossReasonModal({
  leadNome,
  onCancel,
  onConfirm,
}: {
  leadNome: string;
  onCancel: () => void;
  onConfirm: (motivo: MotivoPerdaEnum, detalhe: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState<MotivoPerdaEnum | "">("");
  const [detalhe, setDetalhe] = useState("");
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!motivo) return;
    setPending(true);
    await onConfirm(motivo, detalhe);
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="font-display text-lg text-auge-green">Motivo da perda</h2>
        <p className="mt-1 text-sm text-auge-green/60">
          Antes de fechar <strong>{leadNome}</strong> como perdido, registre o motivo — isso
          alimenta o relatório de objeções mais comuns.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-auge-green">Motivo estruturado</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoPerdaEnum)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {MOTIVOS_PERDA.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-auge-green">
            Detalhe / objeção do cliente
          </label>
          <textarea
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            rows={3}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20"
            placeholder="Ex: cliente achou o valor acima do orçamento disponível para este trimestre…"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-auge-green/70 transition hover:bg-auge-beige-dark"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!motivo || pending}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Confirmar perda"}
          </button>
        </div>
      </div>
    </div>
  );
}
