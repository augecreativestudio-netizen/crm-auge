-- ============================================================================
-- Auge CRM — V1 schema
-- Módulos: mercados, usuários, leads/pipeline, interações, propostas,
-- motivos de perda, follow-ups, metas, campanhas de ads.
-- Ver CLAUDE.md (seção 5) para o modelo de dados original do briefing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensões
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type papel_usuario as enum ('admin', 'comercial');

create type origem_lead as enum (
  'prospeccao_ativa',
  'trafego_meta_ads',
  'trafego_google_ads',
  'indicacao',
  'organico_redes',
  'site',
  'outro'
);

create type estagio_pipeline as enum (
  'novo_lead',
  'qualificacao',
  'reuniao_agendada',
  'proposta_enviada',
  'em_negociacao',
  'fechado_ganho',
  'fechado_perdido'
);

create type tipo_interacao as enum ('ligacao', 'reuniao', 'nota');

create type status_proposta as enum ('enviada', 'aceita', 'recusada', 'expirada');

create type motivo_perda_enum as enum (
  'preco',
  'timing',
  'concorrente',
  'sem_orcamento',
  'sem_resposta',
  'publico_errado',
  'outro'
);

create type plataforma_ads as enum ('meta_ads', 'google_ads');

create type tipo_meta_enum as enum (
  'contatos_dia',
  'propostas_semana',
  'taxa_conversao',
  'valor_fechado'
);

-- ----------------------------------------------------------------------------
-- mercados — segmentação BR / Internacional / Portugal (seção 3 do briefing)
-- ----------------------------------------------------------------------------
create table mercados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,            -- 'BR' | 'INTL' | 'PT'
  nome text not null,
  idioma text not null,                   -- 'pt-BR' | 'en' | 'pt-PT'
  moeda text not null,                    -- 'BRL' | 'USD' | 'EUR'
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- usuarios — espelha auth.users (Supabase Auth), 1:1
-- ----------------------------------------------------------------------------
create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  papel papel_usuario not null default 'comercial',
  mercado_padrao_id uuid references mercados (id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- campanhas_ads — preparado para integração futura com Meta Ads / Google Ads
-- (seção 4.8): plataforma, campaign_id, nome, custo, data, ligado a um mercado.
-- ----------------------------------------------------------------------------
create table campanhas_ads (
  id uuid primary key default gen_random_uuid(),
  mercado_id uuid references mercados (id),
  plataforma plataforma_ads not null,
  campaign_id text,                       -- id externo (Meta/Google), nulo até integração real
  nome text not null,
  custo numeric(12, 2) default 0,
  leads_gerados integer not null default 0,
  periodo_inicio date,
  periodo_fim date,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- leads_clientes — núcleo do funil comercial
-- ----------------------------------------------------------------------------
create table leads_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  contato text,                           -- telefone/e-mail/whatsapp em texto livre
  mercado_id uuid not null references mercados (id),
  origem origem_lead not null,
  campanha_id uuid references campanhas_ads (id),
  estagio_atual estagio_pipeline not null default 'novo_lead',
  responsavel_id uuid references usuarios (id),
  criado_por uuid references usuarios (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_leads_mercado on leads_clientes (mercado_id);
create index idx_leads_estagio on leads_clientes (estagio_atual);
create index idx_leads_responsavel on leads_clientes (responsavel_id);

-- Mantém atualizado_em em dia a cada UPDATE
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_atualizado_em
  before update on leads_clientes
  for each row execute function set_atualizado_em();

-- ----------------------------------------------------------------------------
-- estagio_historico — histórico de mudança de estágio (seção 4.2)
-- ----------------------------------------------------------------------------
create table estagio_historico (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads_clientes (id) on delete cascade,
  estagio_anterior estagio_pipeline,
  estagio_novo estagio_pipeline not null,
  usuario_id uuid references usuarios (id),
  criado_em timestamptz not null default now()
);

create index idx_estagio_historico_lead on estagio_historico (lead_id);

-- Registra automaticamente toda mudança de estágio
create or replace function log_estagio_change()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and new.estagio_atual is distinct from old.estagio_atual)
     or tg_op = 'INSERT' then
    insert into estagio_historico (lead_id, estagio_anterior, estagio_novo, usuario_id)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.estagio_atual else null end,
      new.estagio_atual,
      new.responsavel_id
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_log_estagio
  after insert or update on leads_clientes
  for each row execute function log_estagio_change();

-- ----------------------------------------------------------------------------
-- interacoes — timeline de ligações, reuniões e notas (seção 4.3)
-- ----------------------------------------------------------------------------
create table interacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads_clientes (id) on delete cascade,
  tipo tipo_interacao not null,
  titulo text,
  transcricao text,                       -- texto colado da reunião/ligação
  usuario_id uuid references usuarios (id),
  data timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index idx_interacoes_lead on interacoes (lead_id);

-- ----------------------------------------------------------------------------
-- propostas — arquivo/link, valor, status (seção 4.3)
-- ----------------------------------------------------------------------------
create table propostas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads_clientes (id) on delete cascade,
  arquivo_url text,                       -- Supabase Storage (bucket "propostas")
  link text,
  valor numeric(12, 2),
  moeda text,
  data_envio date not null default current_date,
  status status_proposta not null default 'enviada',
  usuario_id uuid references usuarios (id),
  criado_em timestamptz not null default now()
);

create index idx_propostas_lead on propostas (lead_id);

-- ----------------------------------------------------------------------------
-- motivos_perda — obrigatório ao marcar "Fechado (perdido)" (seção 4.4)
-- ----------------------------------------------------------------------------
create table motivos_perda (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references leads_clientes (id) on delete cascade,
  motivo_estruturado motivo_perda_enum not null,
  detalhe_texto text,
  usuario_id uuid references usuarios (id),
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- followups — lembretes/tarefas vinculadas a um lead (seção 4.5)
-- ----------------------------------------------------------------------------
create table followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads_clientes (id) on delete cascade,
  titulo text not null,
  data_prevista date not null,
  concluido boolean not null default false,
  concluido_em timestamptz,
  responsavel_id uuid references usuarios (id),
  criado_em timestamptz not null default now()
);

create index idx_followups_lead on followups (lead_id);
create index idx_followups_pendentes on followups (data_prevista) where not concluido;

-- ----------------------------------------------------------------------------
-- metas — metas comerciais por usuário/mercado/período (seção 4.6, V2)
-- ----------------------------------------------------------------------------
create table metas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios (id),   -- null = meta agregada do mercado/time
  mercado_id uuid not null references mercados (id),
  periodo text not null,                      -- ex: '2026-08' (mês) ou '2026-W33' (semana)
  tipo_meta tipo_meta_enum not null,
  valor_meta numeric(12, 2) not null,
  valor_realizado numeric(12, 2) not null default 0,
  criado_em timestamptz not null default now()
);

create index idx_metas_usuario on metas (usuario_id);
create index idx_metas_periodo on metas (periodo);

-- ============================================================================
-- Seed de referência: mercados (necessário para o app funcionar)
-- ============================================================================
insert into mercados (codigo, nome, idioma, moeda) values
  ('BR', 'Brasil', 'pt-BR', 'BRL'),
  ('INTL', 'Internacional', 'en', 'USD'),
  ('PT', 'Portugal', 'pt-PT', 'EUR')
on conflict (codigo) do nothing;

-- ============================================================================
-- Trigger: cria automaticamente uma linha em `usuarios` quando alguém se
-- cadastra via Supabase Auth (auth.users). Papel padrão: comercial.
-- Um admin deve promover manualmente o primeiro usuário para 'admin'
-- (ver README.md).
-- ============================================================================
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nome, email, papel, mercado_padrao_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'comercial',
    (select id from public.mercados where codigo = 'BR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table mercados enable row level security;
alter table usuarios enable row level security;
alter table campanhas_ads enable row level security;
alter table leads_clientes enable row level security;
alter table estagio_historico enable row level security;
alter table interacoes enable row level security;
alter table propostas enable row level security;
alter table motivos_perda enable row level security;
alter table followups enable row level security;
alter table metas enable row level security;

-- Helper: papel do usuário autenticado
create or replace function auth_papel()
returns papel_usuario as $$
  select papel from public.usuarios where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function is_admin()
returns boolean as $$
  select coalesce(auth_papel() = 'admin', false);
$$ language sql stable security definer set search_path = public;

-- mercados: qualquer usuário autenticado pode ler; só admin altera
create policy "mercados_select_all" on mercados for select
  using (auth.uid() is not null);
create policy "mercados_admin_write" on mercados for all
  using (is_admin()) with check (is_admin());

-- usuarios: todo mundo vê a lista (para atribuir responsáveis); só o próprio
-- usuário ou um admin pode alterar o registro
create policy "usuarios_select_all" on usuarios for select
  using (auth.uid() is not null);
create policy "usuarios_update_self_or_admin" on usuarios for update
  using (id = auth.uid() or is_admin());
create policy "usuarios_admin_insert" on usuarios for insert
  with check (is_admin() or id = auth.uid());

-- campanhas_ads: leitura geral, escrita só admin (V1); V3 integra via service role
create policy "campanhas_select_all" on campanhas_ads for select
  using (auth.uid() is not null);
create policy "campanhas_admin_write" on campanhas_ads for all
  using (is_admin()) with check (is_admin());

-- leads_clientes: admin vê tudo; comercial vê o que é responsável ou o que criou
create policy "leads_select" on leads_clientes for select
  using (is_admin() or responsavel_id = auth.uid() or criado_por = auth.uid());
create policy "leads_insert" on leads_clientes for insert
  with check (auth.uid() is not null);
create policy "leads_update" on leads_clientes for update
  using (is_admin() or responsavel_id = auth.uid());
create policy "leads_delete_admin" on leads_clientes for delete
  using (is_admin());

-- tabelas filhas de lead: seguem a mesma visibilidade do lead pai
create policy "estagio_historico_select" on estagio_historico for select
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ));
create policy "estagio_historico_insert" on estagio_historico for insert
  with check (auth.uid() is not null);

create policy "interacoes_select" on interacoes for select
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ));
create policy "interacoes_write" on interacoes for all
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ))
  with check (auth.uid() is not null);

create policy "propostas_select" on propostas for select
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ));
create policy "propostas_write" on propostas for all
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ))
  with check (auth.uid() is not null);

create policy "motivos_perda_select" on motivos_perda for select
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ));
create policy "motivos_perda_write" on motivos_perda for all
  using (exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (is_admin() or l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ))
  with check (auth.uid() is not null);

create policy "followups_select" on followups for select
  using (is_admin() or responsavel_id = auth.uid() or exists (
    select 1 from leads_clientes l where l.id = lead_id
      and (l.responsavel_id = auth.uid() or l.criado_por = auth.uid())
  ));
create policy "followups_write" on followups for all
  using (is_admin() or responsavel_id = auth.uid())
  with check (auth.uid() is not null);

-- metas: usuário vê a própria e as agregadas do time; admin vê tudo
create policy "metas_select" on metas for select
  using (is_admin() or usuario_id = auth.uid() or usuario_id is null);
create policy "metas_admin_write" on metas for all
  using (is_admin()) with check (is_admin());
