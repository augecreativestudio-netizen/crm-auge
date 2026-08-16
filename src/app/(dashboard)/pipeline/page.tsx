import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { LeadComRelacoes } from "@/components/kanban/LeadCard";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ mercado?: string }>;
}) {
  const { mercado: mercadoCodigo } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("leads_clientes")
    .select("*")
    .order("criado_em", { ascending: false });

  if (mercadoCodigo) {
    const { data: mercado } = await supabase
      .from("mercados")
      .select("id")
      .eq("codigo", mercadoCodigo)
      .single();
    if (mercado) query = query.eq("mercado_id", mercado.id);
  }

  const { data: leads } = await query;
  const { data: usuarios } = await supabase.from("usuarios").select("id, nome");

  const usuarioMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));

  const leadIds = (leads ?? []).map((l) => l.id);
  const { data: followupsPendentes } =
    leadIds.length > 0
      ? await supabase
          .from("followups")
          .select("lead_id, tipo, titulo, data_prevista")
          .in("lead_id", leadIds)
          .eq("concluido", false)
          .order("data_prevista", { ascending: true })
      : { data: [] };

  // Já vem ordenado por data_prevista ascendente, então o primeiro que
  // encontrarmos por lead_id é o mais próximo/mais atrasado (tarefa ou follow-up).
  const proximoFollowupPorLead = new Map<
    string,
    { tipo: "tarefa" | "follow_up"; titulo: string; data_prevista: string }
  >();
  for (const f of followupsPendentes ?? []) {
    if (!proximoFollowupPorLead.has(f.lead_id)) {
      proximoFollowupPorLead.set(f.lead_id, { tipo: f.tipo, titulo: f.titulo, data_prevista: f.data_prevista });
    }
  }

  const leadsComRelacoes: LeadComRelacoes[] = (leads ?? []).map((lead) => ({
    ...lead,
    responsavel_nome: lead.responsavel_id ? usuarioMap.get(lead.responsavel_id) ?? null : null,
    proximo_followup: proximoFollowupPorLead.get(lead.id) ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-auge-green">Pipeline comercial</h1>
          <p className="text-sm text-auge-green/60">
            Arraste os cards entre as colunas para mudar o estágio.
          </p>
        </div>
        <Link
          href={mercadoCodigo ? `/leads/novo?mercado=${mercadoCodigo}` : "/leads/novo"}
          className="rounded-lg bg-auge-brown px-4 py-2 text-sm font-semibold text-white transition hover:bg-auge-brown-light"
        >
          + Novo lead
        </Link>
      </div>
      <KanbanBoard leads={leadsComRelacoes} />
    </div>
  );
}
