import type {
  EstagioPipeline,
  MotivoPerdaEnum,
  OrigemLead,
  TipoFollowup,
  TipoInteracao,
  TipoMetaEnum,
} from "@/lib/types/database";

export const ESTAGIOS: { value: EstagioPipeline; label: string }[] = [
  { value: "novo_lead", label: "Novo lead" },
  { value: "contato_inicial", label: "Contato inicial" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "reuniao_agendada", label: "Reunião agendada" },
  { value: "proposta_enviada", label: "Proposta apresentada" },
  { value: "follow_up", label: "Follow-up" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "fechado_ganho", label: "Fechado (ganho)" },
  { value: "fechado_perdido", label: "Fechado (perdido)" },
];

export const ESTAGIOS_KANBAN = ESTAGIOS; // todas as colunas aparecem no board

export function estagioLabel(value: EstagioPipeline) {
  return ESTAGIOS.find((e) => e.value === value)?.label ?? value;
}

export const ORIGENS: { value: OrigemLead; label: string }[] = [
  { value: "prospeccao_ativa", label: "Prospecção ativa (outbound)" },
  { value: "trafego_meta_ads", label: "Tráfego pago — Meta Ads" },
  { value: "trafego_google_ads", label: "Tráfego pago — Google Ads" },
  { value: "indicacao", label: "Indicação" },
  { value: "organico_redes", label: "Orgânico / Redes sociais" },
  { value: "site", label: "Site" },
  { value: "outro", label: "Outro" },
];

export function origemLabel(value: OrigemLead) {
  return ORIGENS.find((o) => o.value === value)?.label ?? value;
}

export const MOTIVOS_PERDA: { value: MotivoPerdaEnum; label: string }[] = [
  { value: "preco", label: "Preço" },
  { value: "timing", label: "Timing" },
  { value: "concorrente", label: "Escolheu concorrente" },
  { value: "sem_orcamento", label: "Sem orçamento" },
  { value: "sem_resposta", label: "Sem resposta / sumiu" },
  { value: "publico_errado", label: "Não era o público-alvo" },
  { value: "outro", label: "Outro" },
];

export function motivoPerdaLabel(value: MotivoPerdaEnum) {
  return MOTIVOS_PERDA.find((m) => m.value === value)?.label ?? value;
}

export const TIPOS_INTERACAO: { value: TipoInteracao; label: string }[] = [
  { value: "ligacao", label: "Ligação" },
  { value: "reuniao", label: "Reunião" },
  { value: "nota", label: "Nota" },
];

export const TIPO_FOLLOWUP_LABEL: Record<TipoFollowup, string> = {
  tarefa: "Tarefa",
  follow_up: "Follow-up",
};

export const MERCADOS_CODIGO = ["BR", "INTL", "PT"] as const;

export const MERCADO_LABEL: Record<(typeof MERCADOS_CODIGO)[number], string> = {
  BR: "Brasil",
  INTL: "Internacional",
  PT: "Portugal",
};

/**
 * Tipos de meta (seção 4.6 do briefing). `unidade` é usada tanto no formulário de
 * cadastro (admin) quanto na exibição do progresso real vs. meta.
 */
export const TIPOS_META: {
  value: TipoMetaEnum;
  label: string;
  unidade: string;
  descricao: string;
}[] = [
  {
    value: "contatos_dia",
    label: "Contatos por dia",
    unidade: "contatos/dia",
    descricao: "Média de ligações/reuniões registradas por dia útil no período.",
  },
  {
    value: "propostas_semana",
    label: "Propostas por semana",
    unidade: "propostas/semana",
    descricao: "Média de propostas enviadas por semana no período.",
  },
  {
    value: "taxa_conversao",
    label: "Taxa de conversão",
    unidade: "%",
    descricao: "% de leads fechados no período que viraram \"Fechado (ganho)\".",
  },
  {
    value: "valor_fechado",
    label: "Valor fechado no mês",
    unidade: "moeda",
    descricao: "Soma do valor das propostas de leads fechados como \"ganho\" no período.",
  },
];

export function tipoMetaLabel(value: TipoMetaEnum) {
  return TIPOS_META.find((t) => t.value === value)?.label ?? value;
}

export function tipoMetaInfo(value: TipoMetaEnum) {
  return TIPOS_META.find((t) => t.value === value) ?? TIPOS_META[0];
}
