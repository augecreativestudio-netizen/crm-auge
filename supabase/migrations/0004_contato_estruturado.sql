-- ============================================================================
-- V2.2 — separa o campo único "contato" em telefone / e-mail / whatsapp
-- ============================================================================

alter table leads_clientes add column if not exists telefone text;
alter table leads_clientes add column if not exists email text;
alter table leads_clientes add column if not exists whatsapp text;

-- Migra o que já existia em "contato" (texto livre) para "telefone", como
-- melhor esforço — não dá pra saber com certeza o tipo do dado antigo, então
-- fica em telefone e o usuário revisa/ajusta manualmente se precisar.
update leads_clientes set telefone = contato where contato is not null and telefone is null;

comment on column leads_clientes.contato is
  'Descontinuado a favor de telefone/email/whatsapp — mantido só para não perder histórico.';
