import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estagioLabel, origemLabel, motivoPerdaLabel, MERCADO_LABEL } from "@/lib/constants";
import { InteracaoForm } from "@/components/leads/InteracaoForm";
import { PropostaForm } from "@/components/leads/PropostaForm";
import { FollowupForm } from "@/components/leads/FollowupForm";
import { FollowupList } from "@/components/leads/FollowupList";
import { addInteracao, addProposta, addFollowup } from "../actions";
import type { Followup, Interacao, Proposta } from "@/lib/types/database";
import { format } from "date-fns";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase.from("leads_clientes").select("*").eq("id", id).single();

  if (!lead) notFound();

  const [
    { data: interacoes },
    { data: propostas },
    { data: followups },
    { data: motivoPerda },
    { data: usuarios },
    { data: mercado },
  ] = await Promise.all([
    supabase.from("interacoes").select("*").eq("lead_id", id).order("data", { ascending: false }),
    supabase.from("propostas").select("*").eq("lead_id", id).order("data_envio", { ascending: false }),
    supabase.from("followups").select("*").eq("lead_id", id).order("data_prevista", { ascending: true }),
    supabase.from("motivos_perda").select("*").eq("lead_id", id).maybeSingle(),
    supabase.from("usuarios").select("id, nome"),
    supabase.from("mercados").select("*").eq("id", lead.mercado_id).single(),
  ]);

  const usuarioMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));
  const mercadoInfo = mercado;

  const boundAddInteracao = addInteracao.bind(null, id);
  const boundAddProposta = addProposta.bind(null, id);
  const boundAddFollowup = addFollowup.bind(null, id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-auge-green">{lead.nome}</h1>
            {lead.empresa && <p className="text-sm text-auge-green/60">{lead.empresa}</p>}
          </div>
          <span className="rounded-full bg-auge-beige-dark px-3 py-1 text-sm font-medium text-auge-green">
            {estagioLabel(lead.estagio_atual)}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Mercado" value={mercadoInfo?.nome ?? MERCADO_LABEL.BR} />
          <Info label="Origem" value={origemLabel(lead.origem)} />
          <Info label="Contato" value={lead.contato ?? "—"} />
          <Info
            label="Responsável"
            value={lead.responsavel_id ? usuarioMap.get(lead.responsavel_id) ?? "—" : "—"}
          />
        </dl>

        {lead.estagio_atual === "fechado_perdido" && motivoPerda && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Motivo da perda:</strong> {motivoPerdaLabel(motivoPerda.motivo_estruturado)}
            {motivoPerda.detalhe_texto && <p className="mt-1">{motivoPerda.detalhe_texto}</p>}
          </div>
        )}
      </div>

      {/* Follow-ups */}
      <Section title="Follow-ups">
        <FollowupForm action={boundAddFollowup} />
        <FollowupList leadId={id} followups={(followups as Followup[]) ?? []} />
      </Section>

      {/* Interações */}
      <Section title="Interações">
        <InteracaoForm action={boundAddInteracao} />
        <ul className="flex flex-col gap-3">
          {((interacoes as Interacao[]) ?? []).map((i) => (
            <li key={i.id} className="rounded-xl border border-border bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-auge-green">
                  {i.titulo || TIPO_LABEL[i.tipo]} · <span className="text-auge-green/50">{TIPO_LABEL[i.tipo]}</span>
                </span>
                <span className="text-xs text-auge-green/40">
                  {format(new Date(i.data), "dd/MM/yyyy HH:mm")} ·{" "}
                  {i.usuario_id ? usuarioMap.get(i.usuario_id) : "—"}
                </span>
              </div>
              {i.transcricao && <p className="mt-2 whitespace-pre-wrap text-auge-green/80">{i.transcricao}</p>}
            </li>
          ))}
          {(!interacoes || interacoes.length === 0) && (
            <p className="text-sm text-auge-green/40">Nenhuma interação registrada.</p>
          )}
        </ul>
      </Section>

      {/* Propostas */}
      <Section title="Propostas">
        <PropostaForm action={boundAddProposta} />
        <ul className="flex flex-col gap-2">
          {((propostas as Proposta[]) ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-4 text-sm"
            >
              <div>
                <p className="font-medium text-auge-green">
                  {p.valor ? `${p.moeda ?? ""} ${p.valor.toLocaleString("pt-BR")}` : "Valor não informado"}
                </p>
                <p className="text-xs text-auge-green/50">
                  Enviada em {format(new Date(p.data_envio + "T00:00:00"), "dd/MM/yyyy")} · {p.status}
                </p>
              </div>
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" className="text-sm text-auge-brown hover:underline">
                  Ver link
                </a>
              )}
            </li>
          ))}
          {(!propostas || propostas.length === 0) && (
            <p className="text-sm text-auge-green/40">Nenhuma proposta enviada ainda.</p>
          )}
        </ul>
      </Section>
    </div>
  );
}

const TIPO_LABEL: Record<Interacao["tipo"], string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  nota: "Nota",
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-auge-green/40">{label}</dt>
      <dd className="text-auge-green">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-3 text-lg text-auge-green">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
