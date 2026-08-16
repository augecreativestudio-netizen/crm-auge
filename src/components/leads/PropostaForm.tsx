"use client";

import { useRef, useTransition } from "react";

export function PropostaForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await action(formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-3 rounded-xl border border-border bg-auge-beige/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="valor" type="number" step="0.01" placeholder="Valor" className={inputClass} />
        <input name="moeda" placeholder="Moeda (BRL/USD/EUR)" className={inputClass} />
        <input name="data_envio" type="date" className={inputClass} />
      </div>
      <input name="link" type="url" placeholder="Link da proposta (opcional)" className={inputClass} />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-auge-green/60">Anexo (PDF)</label>
        <input name="arquivo" type="file" accept="application/pdf" className="text-sm" />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-auge-green px-4 py-2 text-sm font-semibold text-auge-beige transition hover:bg-auge-green-light disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Registrar proposta"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";
