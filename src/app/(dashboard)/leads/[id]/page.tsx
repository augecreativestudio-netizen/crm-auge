import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estagioLabel, origemLabel, motivoPerdaLabel, MERCADO_LABEL } from "@/lib/constants";
import { InteracaoForm } from "@/components/leads/InteracaoForm";
import { InteracaoItem } from "@/components/leads/InteracaoItem";
import { PropostaForm } from "@/components/leads/PropostaForm";
import { PropostaItem } from "@/components/leads/PropostaItem";
import { FollowupForm } from "@/components/leads/FollowupForm";
import { FollowupList } from "@/components/leads/FollowupList";
import { addInteracao, addProposta, addTarefa, addFollowUp } from "../actions";
import type { Followup, Interacao, Proposta } from "@/lib/types/database";

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
  const boundAddTarefa = addTarefa.bind(null, id);
  const boundAddFollowUp = addFollowUp.bind(null, id);

  const todosFollowups = (followups as Followup[]) ?? [];
  const tarefas = todosFollowups.filter((f) => f.tipo === "tarefa");
  const followUpsApenas = todosFollowups.filter((f) => f.tipo === "follow_up");

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
          <Info
            label="Responsável"
            value={lead.responsavel_id ? usuarioMap.get(lead.responsavel_id) ?? "—" : "—"}
          />
          <Info label="Telefone" value={lead.telefone ?? "—"} href={lead.telefone ? `tel:${lead.telefone}` : undefined} />
          <Info label="E-mail" value={lead.email ?? "—"} href={lead.email ? `mailto:${lead.email}` : undefined} />
          <Info
            label="WhatsApp"
            value={lead.whatsapp ?? "—"}
            href={lead.whatsapp ? `https://wa.me/${lead.whatsapp.replace(/\D/g, "")}` : undefined}
          />
          <Info
            label="Instagram"
            value={lead.instagram ?? "—"}
            href={
              lead.instagram
                ? `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
                : undefined
            }
          />
          <Info
            label="Site"
            value={lead.site ?? "—"}
            href={lead.site ? (lead.site.startsWith("http") ? lead.site : `https://${lead.site}`) : undefined}
          />
        </dl>

        {lead.estagio_atual === "fechado_perdido" && motivoPerda && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Motivo da perda:</strong> {motivoPerdaLabel(motivoPerda.motivo_estruturado)}
            {motivoPerda.detalhe_texto && <p className="mt-1">{motivoPerda.detalhe_texto}</p>}
          </div>
        )}
      </div>

      {/* Tarefas — ações internas do vendedor, ex: "Elaborar proposta" */}
      <Section title="Tarefas">
        <FollowupForm action={boundAddTarefa} placeholder="Ex: elaborar proposta" />
        <FollowupList leadId={id} followups={tarefas} emptyMessage="Nenhuma tarefa cadastrada." />
      </Section>

      {/* Follow-ups — próximo contato com o lead, ex: "Ligar de volta em 3 dias" */}
      <Section title="Follow-ups">
        <FollowupForm action={boundAddFollowUp} placeholder="Ex: ligar de volta em 3 dias" />
        <FollowupList leadId={id} followups={followUpsApenas} emptyMessage="Nenhum follow-up agendado." />
      </Section>

      {/* Interações */}
      <Section title="Interações">
        <InteracaoForm action={boundAddInteracao} />
        <ul className="flex flex-col gap-3">
          {((interacoes as Interacao[]) ?? []).map((i) => (
            <InteracaoItem
              key={i.id}
              leadId={id}
              interacao={i}
              nomeAutor={i.usuario_id ? usuarioMap.get(i.usuario_id) ?? "—" : "—"}
            />
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
            <PropostaItem key={p.id} leadId={id} proposta={p} />
          ))}
          {(!propostas || propostas.length === 0) && (
            <p className="text-sm text-auge-green/40">Nenhuma proposta enviada ainda.</p>
          )}
        </ul>
      </Section>
    </div>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-auge-green/40">{label}</dt>
      <dd className="text-auge-green">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-auge-brown hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
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
