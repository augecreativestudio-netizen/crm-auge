import type {
  EstagioHistorico,
  Interacao,
  LeadCliente,
  Meta,
  Proposta,
  TipoMetaEnum,
} from "@/lib/types/database";
import { tipoMetaInfo } from "@/lib/constants";

/**
 * Motor de cálculo do "realizado" das metas (seção 4.6 do briefing).
 *
 * Decisão de design: `metas.valor_realizado` (coluna do schema) NÃO é usada — o
 * realizado é sempre calculado ao vivo a partir de interações/propostas/histórico
 * de estágio no período selecionado. Isso evita ter que manter esse número
 * sincronizado via cron/trigger, ao custo de mais queries na página /metas. Se o
 * volume de dados justificar, dá pra materializar isso depois.
 *
 * Importante: como a query roda com a sessão do usuário logado, RLS se aplica.
 * Um usuário "comercial" só enxerga os próprios leads — então uma meta "do time"
 * (usuario_id = null) vista por um comercial mostra o realizado apenas da fatia
 * que ele consegue ver, não do time inteiro. Metas de time ficam precisas quando
 * vistas por um admin.
 */

export type PeriodoRange = {
  periodo: string; // "YYYY-MM"
  start: Date;
  end: Date; // exclusivo
  diasNoMes: number;
  diasDecorridos: number; // 0 se período é no futuro; diasNoMes se já passou
  semanasDecorridas: number; // mínimo 1 para evitar divisão por zero
};

export function getPeriodoRange(periodo: string, hoje: Date = new Date()): PeriodoRange {
  const [anoStr, mesStr] = periodo.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr); // 1-12

  const start = new Date(ano, mes - 1, 1);
  const end = new Date(ano, mes, 1);
  const diasNoMes = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  let diasDecorridos: number;
  if (hoje < start) {
    diasDecorridos = 0;
  } else if (hoje >= end) {
    diasDecorridos = diasNoMes;
  } else {
    diasDecorridos = hoje.getDate();
  }

  const semanasDecorridas = Math.max(1, Math.ceil(diasDecorridos / 7));

  return { periodo, start, end, diasNoMes, diasDecorridos, semanasDecorridas };
}

export type MetaComRealizado = {
  meta: Meta;
  realizado: number | null; // null = período ainda não começou, sem dados
  percentual: number | null; // realizado / meta * 100, null se meta = 0 ou realizado = null
  formatado: string;
};

type Insumos = {
  range: PeriodoRange;
  leads: Pick<LeadCliente, "id" | "mercado_id" | "responsavel_id">[];
  interacoes: Pick<Interacao, "lead_id" | "usuario_id" | "tipo" | "data">[];
  propostas: Pick<Proposta, "lead_id" | "usuario_id" | "valor" | "data_envio">[];
  estagioHistorico: Pick<EstagioHistorico, "lead_id" | "estagio_novo" | "criado_em">[];
};

function formatarValor(tipo: TipoMetaEnum, valor: number | null, moeda: string): string {
  if (valor === null) return "—";
  const info = tipoMetaInfo(tipo);
  if (tipo === "taxa_conversao") return `${valor.toFixed(1)}%`;
  if (tipo === "valor_fechado") {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: moeda || "BRL" });
  }
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${info.unidade}`;
}

export function calcularMetas(metas: Meta[], insumos: Insumos, moedaPorMercado: Map<string, string>): MetaComRealizado[] {
  const { range, leads, interacoes, propostas, estagioHistorico } = insumos;

  const leadInfo = new Map(leads.map((l) => [l.id, l]));

  return metas.map((meta) => {
    const escopoUsuario = meta.usuario_id;
    const pertenceAoEscopo = (leadId: string, usuarioDoRegistro: string | null) => {
      const lead = leadInfo.get(leadId);
      if (!lead || lead.mercado_id !== meta.mercado_id) return false;
      if (!escopoUsuario) return true; // meta agregada do mercado/time
      // para interações/propostas, o autor do registro é quem "conta"
      return usuarioDoRegistro === escopoUsuario;
    };

    let realizado: number | null = null;

    if (meta.tipo_meta === "contatos_dia") {
      const total = interacoes.filter(
        (i) => (i.tipo === "ligacao" || i.tipo === "reuniao") && pertenceAoEscopo(i.lead_id, i.usuario_id)
      ).length;
      realizado = range.diasDecorridos > 0 ? total / range.diasDecorridos : total > 0 ? total : null;
    }

    if (meta.tipo_meta === "propostas_semana") {
      const total = propostas.filter((p) => pertenceAoEscopo(p.lead_id, p.usuario_id)).length;
      realizado = total / range.semanasDecorridas;
    }

    if (meta.tipo_meta === "taxa_conversao" || meta.tipo_meta === "valor_fechado") {
      // Para essas duas, o "dono" do registro é o responsável pelo lead, não quem
      // logou a interação/proposta.
      const fechamentosNoPeriodo = estagioHistorico.filter((h) => {
        const lead = leadInfo.get(h.lead_id);
        if (!lead || lead.mercado_id !== meta.mercado_id) return false;
        if (escopoUsuario && lead.responsavel_id !== escopoUsuario) return false;
        return h.estagio_novo === "fechado_ganho" || h.estagio_novo === "fechado_perdido";
      });

      if (meta.tipo_meta === "taxa_conversao") {
        const ganhos = fechamentosNoPeriodo.filter((h) => h.estagio_novo === "fechado_ganho").length;
        const total = fechamentosNoPeriodo.length;
        realizado = total > 0 ? (ganhos / total) * 100 : null;
      } else {
        const leadsGanhos = new Set(
          fechamentosNoPeriodo.filter((h) => h.estagio_novo === "fechado_ganho").map((h) => h.lead_id)
        );
        const total = propostas
          .filter((p) => leadsGanhos.has(p.lead_id))
          .reduce((soma, p) => soma + (p.valor ?? 0), 0);
        realizado = total;
      }
    }

    const percentual =
      realizado !== null && meta.valor_meta > 0 ? (realizado / meta.valor_meta) * 100 : null;

    const moeda = moedaPorMercado.get(meta.mercado_id) ?? "BRL";

    return {
      meta,
      realizado,
      percentual,
      formatado: formatarValor(meta.tipo_meta, realizado, moeda),
    };
  });
}
