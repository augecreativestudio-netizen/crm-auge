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

  const leadsComRelacoes: LeadComRelacoes[] = (leads ?? []).map((lead) => ({
    ...lead,
    responsavel_nome: lead.responsavel_id ? usuarioMap.get(lead.responsavel_id) ?? null : null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-auge-green">Pipeline comercial</h1>
        <p className="text-sm text-auge-green/60">
          Arraste os cards entre as colunas para mudar o estágio.
        </p>
      </div>
      <KanbanBoard leads={leadsComRelacoes} />
    </div>
  );
}
