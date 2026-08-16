-- ============================================================================
-- Storage: bucket privado para anexos de propostas (PDFs etc. — seção 4.3)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('propostas', 'propostas', false)
on conflict (id) do nothing;

create policy "propostas_bucket_read" on storage.objects for select
  using (bucket_id = 'propostas' and auth.uid() is not null);

create policy "propostas_bucket_write" on storage.objects for insert
  with check (bucket_id = 'propostas' and auth.uid() is not null);

create policy "propostas_bucket_update" on storage.objects for update
  using (bucket_id = 'propostas' and auth.uid() is not null);

create policy "propostas_bucket_delete" on storage.objects for delete
  using (bucket_id = 'propostas' and (
    owner = auth.uid() or exists (
      select 1 from public.usuarios u where u.id = auth.uid() and u.papel = 'admin'
    )
  ));
