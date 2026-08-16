"use client";

import { useActionState, useRef, useEffect } from "react";
import { createMeta, type MetaFormState } from "@/app/(dashboard)/metas/actions";
import { TIPOS_META } from "@/lib/constants";
import type { Mercado, Usuario } from "@/lib/types/database";

export function MetaForm({
  mercados,
  usuarios,
  periodoAtual,
}: {
  mercados: Mercado[];
  usuarios: Usuario[];
  periodoAtual: string;
}) {
  const [state, action, pending] = useActionState<MetaFormState, FormData>(createMeta, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-auge-beige/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <Field label="Responsável">
        <select name="usuario_id" defaultValue="" className={inputClass}>
          <option value="">Time inteiro (mercado)</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mercado">
        <select name="mercado_id" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Selecione…
          </option>
          {mercados.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo de meta">
        <select name="tipo_meta" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Selecione…
          </option>
          {TIPOS_META.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Período">
        <input type="month" name="periodo" required defaultValue={periodoAtual} className={inputClass} />
      </Field>

      <Field label="Valor da meta">
        <input type="number" name="valor_meta" step="0.01" min="0" required className={inputClass + " w-32"} />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-auge-green px-4 py-2 text-sm font-semibold text-auge-beige transition hover:bg-auge-green-light disabled:opacity-60"
      >
        {pending ? "Salvando…" : "+ Meta"}
      </button>

      {state?.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3 py-2 text-sm text-auge-green outline-none focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-auge-green">{label}</span>
      {children}
    </label>
  );
}
