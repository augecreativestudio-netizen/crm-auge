-- ============================================================================
-- V2.3 — Tarefas e Follow-ups são coisas diferentes, com cadastro e lista
-- separados na UI, mas continuam na mesma tabela `followups` (mesma estrutura
-- de dado: título + prazo + responsável + concluído), diferenciadas por um
-- novo campo `tipo`.
--
-- tarefa     = ação interna do vendedor (ex: "Elaborar proposta")
-- follow_up  = próximo contato com o lead (ex: "Ligar de volta em 3 dias")
-- ============================================================================

create type tipo_followup as enum ('tarefa', 'follow_up');

alter table followups add column if not exists tipo tipo_followup not null default 'follow_up';
