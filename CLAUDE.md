@AGENTS.md

# CRM Auge Creative Studio

Este arquivo é o briefing do projeto (colado pelo usuário) + decisões de arquitetura tomadas na
V1. Ver também [README.md](./README.md) para setup e estrutura de pastas.

## Stack decidida (V1)

- **Frontend/Backend:** Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4
- **Banco/Auth/Storage:** Supabase (Postgres + Supabase Auth + Storage) — escolhido no lugar de
  Postgres genérico/NextAuth por simplicidade (uma peça a menos) e por já cobrir upload de
  propostas (seção 4.3) via Storage.
- **Deploy alvo:** Vercel (não configurado ainda nesta sessão).
- **Drag-and-drop do kanban:** @dnd-kit.

## Decisões de RLS/autorização

- `usuarios.papel`: `admin` (vê tudo, todos os mercados) ou `comercial` (vê leads onde é
  `responsavel_id` ou `criado_por`) — seção 4.7 do briefing.
- Toda tabela filha de um lead (interações, propostas, motivos de perda) herda a visibilidade do
  lead pai via policy com `exists (select 1 from leads_clientes ...)`.
- Ao cadastrar um usuário no Supabase Auth, um trigger (`handle_new_auth_user`) cria
  automaticamente a linha em `usuarios` com papel `comercial` — o primeiro admin precisa ser
  promovido manualmente via SQL (ver README).

## Coisas específicas do Next.js 16 usadas neste projeto

Este projeto usa Next 16, que tem mudanças que não estão no treinamento de modelos mais antigos —
os docs completos estão em `node_modules/next/dist/docs/`. As mais relevantes aqui:

- **Middleware foi renomeado para "Proxy"** → arquivo é `src/proxy.ts` (não `middleware.ts`),
  exporta `proxy()` em vez de `middleware()`.
- **`PageProps<'/rota'>` / `LayoutProps<'/rota'>`** são helpers de tipo globais gerados por
  `next dev`/`next build` — não precisam de import. Usados nas páginas com `params`/`searchParams`
  tipados.
- Tailwind v4: tema definido via `@theme inline` em `globals.css` (não `tailwind.config.ts`).

## Nota sobre `src/lib/types/database.ts`

Os tipos são escritos à mão (não gerados pelo Supabase CLI, pois este ambiente não está linkado a
um projeto Supabase real). Um detalhe não-óbvio: são declarados com `type`, não `interface` —
`@supabase/postgrest-js` exige que os tipos de linha sejam estruturalmente atribuíveis a
`Record<string, unknown>`, e `interface` não ganha essa assinatura de índice implícita em
TypeScript (só `type` com literal de objeto ganha). Usar `interface` aqui faz todo o resultado das
queries colapsar silenciosamente para `never`. Depois de linkar a um projeto Supabase real, troque
este arquivo por um gerado com `npx supabase gen types typescript`.

Por esse mesmo motivo, as páginas evitam `.select('*, tabela(...)')` (embeds/joins do PostgREST) —
sem os `Relationships` reais do banco no tipo `Database`, o parser de select não consegue tipar o
embed. Em vez disso, o padrão usado é: duas queries simples + `Map` para juntar os dados em
memória (ver `leads/page.tsx`, `leads/[id]/page.tsx`, `pipeline/page.tsx`). Isso deixa de ser
necessário assim que os tipos forem gerados de verdade.

## Briefing original do usuário

<details>
<summary>Conteúdo completo de CRM_AUGE_BRIEFING.md (clique para expandir)</summary>

### 1. Contexto

A Auge Creative Studio é uma agência de marketing digital sediada em Florianópolis/SC, que atua
com clientes no Brasil e está expandindo para clientes falantes de inglês e de Portugal. O
objetivo deste projeto é construir um CRM próprio para controlar todo o funil comercial da
agência — da entrada do lead até o fechamento (ou perda) do contrato — além de acompanhar metas e,
futuramente, integrar com Meta Ads e Google Ads.

### 2. Identidade visual

| Uso | Cor | Hex |
|---|---|---|
| Primária (verde) | Verde escuro | `#1B4330` |
| Secundária/destaque | Marrom/laranja queimado | `#A75F1E` |
| Fundo/neutro claro | Bege claro | `#EFE9D3` |

Tipografia: Calistoga (títulos/branding), Poppins (interface), Caveat (detalhes/assinatura).
Logo em `public/auge-logo.png`.

### 3. Estrutura geral: multi-mercado

Três mercados segmentados dentro do mesmo sistema (campo/dimensão "Mercado" que filtra pipeline,
metas, relatórios): **Brasil** (pt-BR, R$), **Internacional** (en, USD), **Portugal** (pt-PT, EUR).

### 4. Módulos funcionais

- **4.1 Gestão de Leads** — nome, empresa, contato, mercado, origem estruturada (Prospecção
  ativa, Meta Ads, Google Ads, Indicação, Orgânico/Redes, Site, Outro) + vínculo de campanha
  quando vier de Ads.
- **4.2 Pipeline (Kanban)** — Novo lead → Qualificação → Reunião agendada → Proposta enviada →
  Em negociação → Fechado (ganho) → Fechado (perdido). Histórico de mudança de estágio com
  data/hora e responsável.
- **4.3 Interações** — timeline por lead: ligações/reuniões, transcrição colável, upload/anexo de
  proposta (PDF/link/valor/data), responsável pelo atendimento.
- **4.4 Motivo de perda** — obrigatório ao marcar "Fechado (perdido)": motivo estruturado (preço,
  timing, concorrente, sem orçamento, sem resposta, público errado, outro) + texto livre.
  Alimenta relatório de motivos de perda mais comuns.
- **4.5 Follow-up** — tarefas/lembretes vinculados a um lead, alerta de atrasados, cadência
  sugerida conforme tempo parado no estágio.
- **4.6 Metas comerciais** — por vendedor/usuário e por mercado (contatos/dia, propostas/semana,
  taxa de conversão, valor fechado/mês). Painel real vs. meta.
- **4.7 Usuários e permissões** — multi-usuário, papéis admin (tudo) / comercial (pode ter visão
  restrita ao que é responsável).
- **4.8 Integrações com Ads** (arquitetura pronta, integração real fica para V3) — Meta Ads API e
  Google Ads API: importar leads automaticamente + métricas de campanha (gasto, CPL, nº leads)
  para ROI por origem. Tabela `campanhas_ads` com `plataforma`, `campaign_id`, `nome_campanha`,
  `custo`, `data`. Credenciais de API só via variáveis de ambiente, nunca hardcoded.

### 5. Modelo de dados (ponto de partida sugerido)

`usuarios`, `mercados`, `leads_clientes`, `interacoes`, `propostas`, `motivos_perda`, `followups`,
`metas`, `campanhas_ads` — implementado em `supabase/migrations/0001_init.sql` com os nomes de
campo do briefing (mais `estagio_historico`, adicionada para o histórico exigido na seção 4.2).

### 6. Stack sugerida

Next.js + Tailwind, backend via API routes do próprio Next.js ou separado, PostgreSQL, auth
simples multi-usuário (NextAuth ou Supabase Auth). Arquitetura pensada para permitir multi-tenant
no futuro (V3 do roadmap da Auge, não deste CRM).

### 7. Roadmap

1. **V1** — CRM básico: cadastro de leads, pipeline kanban, interações, propostas, motivos de
   perda, follow-ups, multi-usuário, separação por mercado.
2. **V2** — Metas comerciais + dashboards de acompanhamento.
3. **V3** — Integrações reais com Meta Ads e Google Ads.
4. **V4** — (projeto separado da Auge) agente de IA para atendimento automático de clientes.

</details>
