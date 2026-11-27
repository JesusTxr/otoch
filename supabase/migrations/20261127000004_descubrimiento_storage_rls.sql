-- Otoch v1.0.0 · Migración 004: bucket Storage inmuebles y políticas RLS para descubrimiento (M3 y M4)
begin;

-- 1. Bucket público para fotografías de inmuebles (máximo 5 MB por imagen)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inmuebles',
  'inmuebles',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Políticas de Storage sobre storage.objects para el bucket inmuebles
create policy fotos_bucket_lectura_publica on storage.objects
for select
using (bucket_id = 'inmuebles');

create policy fotos_bucket_alta_arrendador on storage.objects
for insert to authenticated
with check (
  bucket_id = 'inmuebles'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy fotos_bucket_actualizacion_arrendador on storage.objects
for update to authenticated
using (
  bucket_id = 'inmuebles'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'inmuebles'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 2. Lectura de estado de verificación de arrendadores en anuncios publicados
create policy arrendador_lectura_autenticados on perfiles_arrendador
for select to authenticated
using (true);

create policy arrendador_lectura_publicados on perfiles_arrendador
for select to anon
using (
  exists (
    select 1 from inmuebles i
    where i.arrendador_id = perfiles_arrendador.perfil_id
      and i.estado = 'publicado'
  )
);

-- 3. Descubrimiento entre roomies y revisión de interesados por arrendadores (respetando bloqueos)
create policy estudiante_descubrimiento on perfiles_estudiante
for select to authenticated
using (
  not exists (
    select 1 from bloqueos b
    where (b.bloqueador_id = perfiles_estudiante.perfil_id and b.bloqueado_id = (select auth.uid()))
       or (b.bloqueador_id = (select auth.uid()) and b.bloqueado_id = perfiles_estudiante.perfil_id)
  )
  and (
    busca_roomies = true
    or exists (
      select 1 from swipes s
      join inmuebles i on i.id = s.inmueble_id
      where s.autor_id = perfiles_estudiante.perfil_id
        and s.decision = 'me_interesa'
        and i.arrendador_id = (select auth.uid())
    )
  )
);

create policy preferencias_descubrimiento on preferencias_convivencia
for select to authenticated
using (
  not exists (
    select 1 from bloqueos b
    where (b.bloqueador_id = preferencias_convivencia.perfil_id and b.bloqueado_id = (select auth.uid()))
       or (b.bloqueador_id = (select auth.uid()) and b.bloqueado_id = preferencias_convivencia.perfil_id)
  )
  and exists (
    select 1 from perfiles_estudiante pe
    where pe.perfil_id = preferencias_convivencia.perfil_id
      and (
        pe.busca_roomies = true
        or exists (
          select 1 from swipes s
          join inmuebles i on i.id = s.inmueble_id
          where s.autor_id = pe.perfil_id
            and s.decision = 'me_interesa'
            and i.arrendador_id = (select auth.uid())
        )
      )
  )
);

-- 4. Permitir al arrendador consultar los swipes realizados sobre sus propios inmuebles (pestaña Interesados)
create policy swipes_interesados_arrendador on swipes
for select to authenticated
using (
  inmueble_id is not null
  and exists (
    select 1 from inmuebles i
    where i.id = swipes.inmueble_id
      and i.arrendador_id = (select auth.uid())
  )
);

commit;
