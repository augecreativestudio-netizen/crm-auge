import { format } from "date-fns";
import { getCurrentUsuario } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { calcularMetas, getPeriodoRange } from "@/lib/metas";
import { MetaCard } from "@/components/metas/MetaCard";
import { MetaForm } from "@/components/metas/MetaForm";
import { PeriodoSwitcher } from "@/components/metas/PeriodoSwitcher";
import type { EstagioHistorico, Interacao, LeadCliente, Proposta } from "@/lib/types/database";

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ mercado?: string; periodo?: string }>;
}) {
  const { mercado: mercadoCodigo, periodo: periodoParam } = await searchParams;
  const usuarioAtual = await getCurrentUsuario();
  const isAdmin = usuarioAtual.papel === "admin";

  const periodo = periodoParam ?? format(new Date(), "yyyy-MM");
  const range = getPeriodoRange(periodo);

  const supabase = await createClient();

  const [{ data: mercados }, { data: usuarios }] = await Promise.all([
    supabase.from("mercados").select("*").order("nome"),
    supabase.from("usuarios").select("*").eq("ativo", true).order("nome"),
  ]);

  const mercadoFiltro = mercadoCodigo ? (mercados ?? []).find((m) => m.codigo === mercadoCodigo) : undefined;
  const moedaPorMercado = new Map((mercados ?? []).map((m) => [m.id, m.moeda]));
  const usuarioMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));
  const mercadoNomeMap = new Map((mercados ?? []).map((m) => [m.id, m.nome]));

  // --- Metas (alvos) do período/mercado selecionado ---
  let metasQuery = supabase.from("metas").select("*").eq("periodo", periodo);
  if (mercadoFiltro) metasQuery = metasQuery.eq("mercado_id", mercadoFiltro.id);
  const { data: metas } = await metasQuery;

  // --- Insumos para calcular o realizado (ver src/lib/metas.ts) ---
  const startISO = range.start.toISOString();
  const endISO = range.end.toISOString();
  const startDate = format(range.start, "yyyy-MM-dd");
  const endDate = format(range.end, "yyyy-MM-dd");

  let leadsQuery = supabase.from("leads_clientes").select("id, mercado_id, responsavel_id");
  if (mercadoFiltro) leadsQuery = leadsQuery.eq("mercado_id", mercadoFiltro.id);

  const [{ data: leads }, { data: interacoes }, { data: propostas }, { data: estagioHistorico }] =
    await Promise.all([
      leadsQuery,
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

  const resultados = calcularMetas(
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-auge-green">Metas comerciais</h1>
          <p className="text-sm text-auge-green/60">Acompanhamento real vs. meta por período.</p>
        </div>
        <PeriodoSwitcher periodoAtual={periodo} />
      </div>

      {isAdmin && (
        <div className="mb-6">
          <MetaForm mercados={mercados ?? []} usuarios={usuarios ?? []} periodoAtual={periodo} />
        </div>
      )}

      {resultados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-auge-green/40">
          {isAdmin
            ? "Nenhuma meta cadastrada para este período/mercado ainda."
            : "Nenhuma meta cadastrada para você neste período ainda."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((item) => (
            <MetaCard
              key={item.meta.id}
              item={item}
              isAdmin={isAdmin}
              responsavelNome={
                item.meta.usuario_id
                  ? usuarioMap.get(item.meta.usuario_id) ?? "—"
                  : `Time inteiro · ${mercadoNomeMap.get(item.meta.mercado_id) ?? ""}`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
