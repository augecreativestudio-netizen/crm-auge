import Link from "next/link";
import { format } from "date-fns";
import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { calcularMetas, getPeriodoRange } from "@/lib/metas";
import { MetaCard } from "@/components/metas/MetaCard";
import { DashboardFollowups, type FollowupComLead } from "@/components/dashboard/DashboardFollowups";
import type { EstagioHistorico, Interacao, LeadCliente, Proposta } from "@/lib/types/database";

export default async function DashboardPage() {
  const usuarioAtual = await getCurrentUsuario();
  const periodo = format(new Date(), "yyyy-MM");
  const range = getPeriodoRange(periodo);

  const supabase = await createClient();

  const [{ data: mercados }, { data: metas }] = await Promise.all([
    supabase.from("mercados").select("*"),
    supabase.from("metas").select("*").eq("periodo", periodo).eq("usuario_id", usuarioAtual.id),
  ]);

  const moedaPorMercado = new Map((mercados ?? []).map((m) => [m.id, m.moeda]));

  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();
  const startDate = format(range.start, "yyyy-MM-dd");
  const endDate = format(range.end, "yyyy-MM-dd");

  const [{ data: leads }, { data: interacoes }, { data: propostas }, { data: estagioHistorico }] =
    await Promise.all([
      supabase.from("leads_clientes").select("id, mercado_id, responsavel_id"),
      supabase
        .from("interacoes")
        .select("lead_id, usuario_id, tipo, data")
        .in("tipo", ["ligacao", "reuniao"])
        .gte("data", startISO)
        .lt("data", endISO),
      supabase
        .from("propostas")
        .select("lead_id, usuario_id, valor, data_envio")
        .gte("data_envio", startDate)
        .lt("data_envio", endDate),
      supabase
        .from("estagio_historico")
        .select("lead_id, estagio_novo, criado_em")
        .in("estagio_novo", ["fechado_ganho", "fechado_perdido"])
        .gte("criado_em", startISO)
        .lt("criado_em", endISO),
    ]);

  const metasComRealizado = calcularMetas(
    metas ?? [],
    {
      range,
      leads: (leads as Pick<LeadCliente, "id" | "mercado_id" | "responsavel_id">[]) ?? [],
      interacoes: (interacoes as Pick<Interacao, "lead_id" | "usuario_id" | "tipo" | "data">[]) ?? [],
      propostas: (propostas as Pick<Proposta, "lead_id" | "usuario_id" | "valor" | "data_envio">[]) ?? [],
      estagioHistorico:
        (estagioHistorico as Pick<EstagioHistorico, "lead_id" | "estagio_novo" | "criado_em">[]) ?? [],
    },
    moedaPorMercado
  );

  const { data: followupsRaw } = await supabase
    .from("followups")
    .select("*")
    .eq("concluido", false)
    .order("data_prevista", { ascending: true })
    .limit(15);

  const leadIds = [...new Set((followupsRaw ?? []).map((f) => f.lead_id))];
  const { data: leadsDosFollowups } =
    leadIds.length > 0
      ? await supabase.from("leads_clientes").select("id, nome").in("id", leadIds)
      : { data: [] };
  const leadNomeMap = new Map((leadsDosFollowups ?? []).map((l) => [l.id, l.nome]));

  const todos: FollowupComLead[] = (followupsRaw ?? []).map((f) => ({
    ...f,
    lead_nome: leadNomeMap.get(f.lead_id) ?? "Lead removido",
  }));
  const tarefas = todos.filter((f) => f.tipo === "tarefa");
  const followUps = todos.filter((f) => f.tipo === "follow_up");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const atrasadasCount = (lista: FollowupComLead[]) =>
    lista.filter((f) => new Date(f.data_prevista + "T00:00:00") < hoje).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-auge-green">Olá, {usuarioAtual.nome.split(" ")[0]}</h1>
        <p className="text-sm text-auge-green/60">Suas tarefas e o resumo do mês.</p>
      </div>

      {/* Tarefas e Follow-ups primeiro — é o que precisa de ação hoje */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg text-auge-green">Tarefas a realizar</h2>
          <span className="text-xs text-auge-green/40">
            {tarefas.length} pendente(s)
            {atrasadasCount(tarefas) > 0 && (
              <span className="ml-1.5 font-semibold text-red-600">· {atrasadasCount(tarefas)} atrasada(s)</span>
            )}
          </span>
        </div>
        <DashboardFollowups followups={tarefas} emptyMessage="Nenhuma tarefa pendente. 🎉" />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg text-auge-green">Follow-ups pendentes</h2>
          <span className="text-xs text-auge-green/40">
            {followUps.length} pendente(s)
            {atrasadasCount(followUps) > 0 && (
              <span className="ml-1.5 font-semibold text-red-600">· {atrasadasCount(followUps)} atrasada(s)</span>
            )}
          </span>
        </div>
        <DashboardFollowups followups={followUps} emptyMessage="Nenhum follow-up pendente. 🎉" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-auge-green">Suas metas do mês</h2>
          <Link href="/metas" className="text-sm text-auge-brown hover:underline">
            Ver todas as metas →
          </Link>
        </div>

        {metasComRealizado.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-auge-green/40">
            Você ainda não tem metas cadastradas para este mês.{" "}
            {usuarioAtual.papel === "admin" && (
              <Link href="/metas" className="text-auge-brown hover:underline">
                Cadastrar agora
              </Link>
            )}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metasComRealizado.map((item) => (
              <MetaCard key={item.meta.id} item={item} isAdmin={false} responsavelNome={usuarioAtual.nome} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
