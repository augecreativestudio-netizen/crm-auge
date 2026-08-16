/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 *
 * Once the project is linked to a real Supabase project, replace this file by
 * running:
 *   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
 *
 * NOTE: these are declared with `type`, not `interface`. @supabase/postgrest-js's
 * `GenericSchema`/`GenericTable` constraints require structural assignability to
 * `Record<string, unknown>`, which TypeScript only grants object type literals
 * (`type X = {...}`) an implicit index signature for — `interface` does not get
 * one, so an `interface` row type here would silently collapse every query's
 * result to `never`.
 */

export type PapelUsuario = "admin" | "comercial";

export type OrigemLead =
  | "prospeccao_ativa"
  | "trafego_meta_ads"
  | "trafego_google_ads"
  | "indicacao"
  | "organico_redes"
  | "site"
  | "outro";

export type EstagioPipeline =
  | "novo_lead"
  | "contato_inicial"
  | "qualificacao"
  | "reuniao_agendada"
  | "proposta_enviada"
  | "follow_up"
  | "em_negociacao"
  | "fechado_ganho"
  | "fechado_perdido";

export type TipoInteracao = "ligacao" | "reuniao" | "nota";

export type StatusProposta = "enviada" | "aceita" | "recusada" | "expirada";

export type MotivoPerdaEnum =
  | "preco"
  | "timing"
  | "concorrente"
  | "sem_orcamento"
  | "sem_resposta"
  | "publico_errado"
  | "outro";

export type PlataformaAds = "meta_ads" | "google_ads";

/** tarefa = ação interna do vendedor; follow_up = próximo contato com o lead */
export type TipoFollowup = "tarefa" | "follow_up";

export type TipoMetaEnum =
  | "contatos_dia"
  | "propostas_semana"
  | "taxa_conversao"
  | "valor_fechado";

export type Mercado = {
  id: string;
  codigo: string;
  nome: string;
  idioma: string;
  moeda: string;
  criado_em: string;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  mercado_padrao_id: string | null;
  ativo: boolean;
  criado_em: string;
};

export type CampanhaAds = {
  id: string;
  mercado_id: string | null;
  plataforma: PlataformaAds;
  campaign_id: string | null;
  nome: string;
  custo: number;
  leads_gerados: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  criado_em: string;
};

export type LeadCliente = {
  id: string;
  nome: string;
  empresa: string | null;
  /** @deprecated substituído por telefone/email/whatsapp — mantido só por compatibilidade com dados antigos */
  contato: string | null;
  telefone: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  site: string | null;
  mercado_id: string;
  origem: OrigemLead;
  campanha_id: string | null;
  estagio_atual: EstagioPipeline;
  responsavel_id: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type EstagioHistorico = {
  id: string;
  lead_id: string;
  estagio_anterior: EstagioPipeline | null;
  estagio_novo: EstagioPipeline;
  usuario_id: string | null;
  criado_em: string;
};

export type Interacao = {
  id: string;
  lead_id: string;
  tipo: TipoInteracao;
  titulo: string | null;
  transcricao: string | null;
  usuario_id: string | null;
  data: string;
  criado_em: string;
};

export type Proposta = {
  id: string;
  lead_id: string;
  arquivo_url: string | null;
  link: string | null;
  valor: number | null;
  moeda: string | null;
  data_envio: string;
  status: StatusProposta;
  usuario_id: string | null;
  criado_em: string;
};

export type MotivoPerda = {
  id: string;
  lead_id: string;
  motivo_estruturado: MotivoPerdaEnum;
  detalhe_texto: string | null;
  usuario_id: string | null;
  criado_em: string;
};

export type Followup = {
  id: string;
  lead_id: string;
  tipo: TipoFollowup;
  titulo: string;
  data_prevista: string;
  concluido: boolean;
  concluido_em: string | null;
  responsavel_id: string | null;
  criado_em: string;
};

export type Meta = {
  id: string;
  usuario_id: string | null;
  mercado_id: string;
  periodo: string;
  tipo_meta: TipoMetaEnum;
  valor_meta: number;
  valor_realizado: number;
  criado_em: string;
};

// Minimal Database shape so `createBrowserClient<Database>` / `createServerClient<Database>`
// type-check against @supabase/postgrest-js's `GenericSchema` constraint (Tables + Views +
// Functions, and each table needs Row/Insert/Update/Relationships).
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      mercados: Table<Mercado>;
      usuarios: Table<Usuario>;
      campanhas_ads: Table<CampanhaAds>;
      leads_clientes: Table<LeadCliente>;
      estagio_historico: Table<EstagioHistorico>;
      interacoes: Table<Interacao>;
      propostas: Table<Proposta>;
      motivos_perda: Table<MotivoPerda>;
      followups: Table<Followup>;
      metas: Table<Meta>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
