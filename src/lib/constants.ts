import type {
  EstagioPipeline,
  MotivoPerdaEnum,
  OrigemLead,
  TipoInteracao,
} from "@/lib/types/database";

export const ESTAGIOS: { value: EstagioPipeline; label: string }[] = [
  { value: "novo_lead", label: "Novo lead" },
  { value: "qualificacao", label: "Qualificação" },
  { value: "reuniao_agendada", label: "Reunião agendada" },
  { value: "proposta_enviada", label: "Proposta enviada" },
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

export const MERCADOS_CODIGO = ["BR", "INTL", "PT"] as const;

export const MERCADO_LABEL: Record<(typeof MERCADOS_CODIGO)[number], string> = {
  BR: "Brasil",
  INTL: "Internacional",
  PT: "Portugal",
};
