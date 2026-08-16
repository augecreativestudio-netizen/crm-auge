"use client";

import { useActionState, useState } from "react";
import { createLead, type LeadFormState } from "../actions";
import { ORIGENS } from "@/lib/constants";
import type { Mercado, OrigemLead, Usuario } from "@/lib/types/database";

export function NewLeadForm({
  mercados,
  usuarios,
  usuarioAtual,
}: {
  mercados: Mercado[];
  usuarios: Usuario[];
  usuarioAtual: Usuario;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(createLead, undefined);
  const [origem, setOrigem] = useState<OrigemLead | "">("");

  const isAdsOrigin = origem === "trafego_meta_ads" || origem === "trafego_google_ads";

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do lead *" htmlFor="nome">
          <input id="nome" name="nome" required className={inputClass} placeholder="Nome do contato" />
        </Field>
        <Field label="Empresa" htmlFor="empresa">
          <input id="empresa" name="empresa" className={inputClass} placeholder="Nome da empresa" />
        </Field>
      </div>

      <Field label="Contato (telefone, e-mail ou WhatsApp)" htmlFor="contato">
        <input id="contato" name="contato" className={inputClass} placeholder="(48) 99999-0000" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mercado *" htmlFor="mercado_id">
          <select id="mercado_id" name="mercado_id" required defaultValue={usuarioAtual.mercado_padrao_id ?? ""} className={inputClass}>
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

        <Field label="Origem do lead *" htmlFor="origem">
          <select
            id="origem"
            name="origem"
            required
            value={origem}
            onChange={(e) => setOrigem(e.target.value as OrigemLead)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {ORIGENS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isAdsOrigin && (
        <Field label="Nome da campanha/anúncio" htmlFor="nome_campanha">
          <input
            id="nome_campanha"
            name="nome_campanha"
            className={inputClass}
            placeholder="Ex: Leads_Agosto_Conversao"
          />
        </Field>
      )}

      <Field label="Responsável" htmlFor="responsavel_id">
        <select id="responsavel_id" name="responsavel_id" defaultValue={usuarioAtual.id} className={inputClass}>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      </Field>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-auge-green px-5 py-2.5 text-sm font-semibold text-auge-beige transition hover:bg-auge-green-light disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Criar lead"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-auge-green outline-none transition focus:border-auge-brown focus:ring-2 focus:ring-auge-brown/20";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-auge-green">
        {label}
      </label>
      {children}
    </div>
  );
}
