"use client";

import { useRef, useTransition } from "react";
import { TIPOS_INTERACAO } from "@/lib/constants";

export function InteracaoForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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
      <div className="flex gap-3">
        <select name="tipo" required className={inputClass + " w-40"} defaultValue="nota">
          {TIPOS_INTERACAO.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input name="titulo" placeholder="Título (opcional)" className={inputClass + " flex-1"} />
      </div>
      <textarea
        name="transcricao"
        rows={3}
        placeholder="Anotações da ligação/reunião, ou cole a transcrição aqui…"
        className={inputClass}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-auge-green px-4 py-2 text-sm font-semibold text-auge-beige transition hover:bg-auge-green-light disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";
