-- ============================================================================
-- V2.1 — ajustes pedidos pelo usuário:
-- 1) Novos estágios no pipeline: "Contato inicial" e "Follow-up"
-- 2) Campos de Instagram e site no cadastro do lead
-- ============================================================================

-- Novos valores do enum de estágio. A ORDEM em que aparecem no kanban é
-- controlada pelo array ESTAGIOS em src/lib/constants.ts, não pela ordem do
-- enum no Postgres — então o "AFTER" aqui é só cosmético (ajuda em ORDER BY
-- estagio_atual, se algum dia for usado), não afeta a UI.
alter type estagio_pipeline add value if not exists 'contato_inicial' after 'novo_lead';
alter type estagio_pipeline add value if not exists 'follow_up' after 'proposta_enviada';

-- Campos adicionais do lead (seção 4.1 do briefing permite estender o cadastro)
alter table leads_clientes add column if not exists instagram text;
alter table leads_clientes add column if not exists site text;
