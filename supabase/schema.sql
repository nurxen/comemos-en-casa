-- ============================================================
-- Comemos en Casa · estructura de la base de datos en Supabase
-- Ejecutar una vez en: Supabase › SQL Editor › New query › Run
-- ============================================================

-- Todos los datos de la app se guardan como documentos JSON
create table if not exists public.docs (
  col        text        not null,               -- colección: day, pantry, recipes, log...
  id         text        not null,               -- identificador dentro de la colección
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

-- Seguridad: solo la cuenta de la familia (usuario con sesión iniciada) puede leer y escribir
alter table public.docs enable row level security;

drop policy if exists "familia_lee" on public.docs;
drop policy if exists "familia_crea" on public.docs;
drop policy if exists "familia_cambia" on public.docs;
drop policy if exists "familia_borra" on public.docs;
create policy "familia_lee"    on public.docs for select to authenticated using (true);
create policy "familia_crea"   on public.docs for insert to authenticated with check (true);
create policy "familia_cambia" on public.docs for update to authenticated using (true) with check (true);
create policy "familia_borra"  on public.docs for delete to authenticated using (true);

-- Cambios en directo entre móviles
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Fotos de las recetas (lectura pública por enlace; solo la familia puede subir o borrar)
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos_subir"  on storage.objects;
drop policy if exists "fotos_cambiar" on storage.objects;
drop policy if exists "fotos_borrar" on storage.objects;
create policy "fotos_subir"   on storage.objects for insert to authenticated with check (bucket_id = 'fotos');
create policy "fotos_cambiar" on storage.objects for update to authenticated using (bucket_id = 'fotos');
create policy "fotos_borrar"  on storage.objects for delete to authenticated using (bucket_id = 'fotos');
