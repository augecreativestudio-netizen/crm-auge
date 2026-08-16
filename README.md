# CRM Auge Creative Studio

CRM comercial da [Auge Creative Studio](https://augecreative.studio) — controla o funil de leads, do
primeiro contato ao fechamento (ou perda), segmentado pelos três mercados da agência (Brasil,
Internacional, Portugal). Ver [CLAUDE.md](./CLAUDE.md) para o briefing completo e o roadmap V1–V4.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) + **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Storage (anexos de propostas)
- **@dnd-kit** — pipeline em kanban arrastável
- Fontes: Calistoga (títulos), Poppins (interface), Caveat (assinatura/toques manuscritos)

## Setup

### 1. Criar o projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode os arquivos de `supabase/migrations/` **na ordem**:
   - `0001_init.sql` — schema completo (mercados, usuários, leads, pipeline, interações,
     propostas, motivos de perda, follow-ups, metas, campanhas de ads) + RLS.
   - `0002_storage.sql` — bucket privado `propostas` para anexos.
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — redireciona para `/login`.

### 4. Criar o primeiro usuário (admin)

Não há tela de cadastro pública (CRM interno — acesso só por convite). Para criar o primeiro
usuário:

1. No painel do Supabase, vá em **Authentication → Users → Add user** (defina e-mail e senha).
2. Isso dispara o trigger `handle_new_auth_user`, que cria automaticamente a linha correspondente
   em `usuarios` com papel `comercial` e mercado padrão `BR`.
3. Promova esse usuário a admin rodando no **SQL Editor**:
   ```sql
   update usuarios set papel = 'admin' where email = 'seu-email@augecreative.studio';
   ```
4. Faça login normalmente pela tela `/login`.

Usuários seguintes: um admin pode criar novos logins pelo mesmo painel (**Authentication →
Users**); o trigger cuida do resto. Uma tela de "convidar membro da equipe" pode entrar na V2.

## Estrutura do projeto

```
src/
  app/
    login/              tela de login (pública)
    (dashboard)/         área autenticada (layout com sidebar + topbar)
      pipeline/           kanban do funil comercial
      leads/              lista de leads, cadastro, detalhe (timeline/propostas/follow-ups)
    actions/auth.ts      Server Action de logout
    proxy.ts             "Proxy" do Next 16 (era middleware.ts) — refresh de sessão + redirects
  components/
    kanban/               board, coluna, card, modal de motivo de perda
    leads/                formulários de interação/proposta/follow-up
    layout/               sidebar, topbar, seletor de mercado
  lib/
    supabase/             clients browser/server (@supabase/ssr)
    dal.ts                Data Access Layer — checagem de sessão centralizada
    constants.ts           labels/opções dos enums (estágios, origens, motivos de perda…)
    types/database.ts      tipos TS espelhando o schema (ver nota no topo do arquivo)
supabase/
  migrations/             SQL — schema, RLS, storage
```

## Roadmap

- **V1 (este repo)** — CRM básico: leads, pipeline kanban, interações, propostas, motivos de
  perda, follow-ups, multi-usuário, segmentação por mercado. ✅
- **V2** — Metas comerciais + dashboards de acompanhamento (tabela `metas` já existe no schema).
- **V3** — Integrações reais com Meta Ads e Google Ads (a tabela `campanhas_ads` já está
  desenhada para isso — ver seção 4.8 do briefing).
- **V4** — Agente de IA para atendimento automático (projeto separado da Auge).

## Notas técnicas

- **Next.js 16 renomeou Middleware para "Proxy"** (`src/proxy.ts`, não `middleware.ts`) — mesma
  função, novo nome. Ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- Tipos do banco em `src/lib/types/database.ts` são escritos à mão. Depois de linkar o projeto ao
  Supabase real, prefira gerar os tipos oficiais:
  ```bash
  npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
  ```
- RLS: `admin` vê tudo; `comercial` vê apenas leads onde é responsável ou criador (seção 4.7 do
  briefing — "comercial pode ter visão restrita ao que é responsável").
