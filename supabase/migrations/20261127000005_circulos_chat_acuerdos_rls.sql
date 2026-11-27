-- Otoch v1.0.0 · Migración 005: políticas RLS para círculos, invitaciones, chat con imágenes y pre-acuerdos (M5, M6 y M7)
begin;

-- 1. Bucket público para adjuntos de imagen en el chat de círculos (máx. 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat',
  'chat',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy chat_bucket_lectura on storage.objects
for select to authenticated
using (bucket_id = 'chat');

create policy chat_bucket_alta on storage.objects
for insert to authenticated
with check (
  bucket_id = 'chat'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 2. Función auxiliar sin recursión RLS para verificar membresía activa o invitación pendiente
create or replace function tiene_membresia_circulo(p_circulo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros_circulo m
    where m.circulo_id = p_circulo
      and m.perfil_id = auth.uid()
      and m.estado in ('invitado', 'activo')
  );
$$;

revoke execute on function tiene_membresia_circulo(uuid) from public, anon;
grant execute on function tiene_membresia_circulo(uuid) to authenticated;

-- 3. Políticas sobre circulos
create policy circulos_invitado_lectura on circulos
for select to authenticated
using (tiene_membresia_circulo(id));

create policy circulos_alta on circulos
for insert to authenticated
with check (creado_por = (select auth.uid()));

create policy circulos_actualizar on circulos
for update to authenticated
using (es_miembro_circulo(id) or creado_por = (select auth.uid()))
with check (es_miembro_circulo(id) or creado_por = (select auth.uid()));

-- 4. Políticas sobre miembros_circulo (alta inicial, invitación de roomies y aceptación/salida)
create policy miembros_circulo_alta on miembros_circulo
for insert to authenticated
with check (
  es_miembro_circulo(circulo_id)
  or exists (
    select 1 from circulos c
    where c.id = miembros_circulo.circulo_id
      and c.creado_por = (select auth.uid())
  )
);

create policy miembros_circulo_respuesta_propia on miembros_circulo
for update to authenticated
using (perfil_id = (select auth.uid()))
with check (perfil_id = (select auth.uid()));

-- 5. Lectura del inmueble asociado para integrantes/invitados del círculo (incluye cuando pasa a pausado/rentado)
create policy inmuebles_miembros_circulo on inmuebles
for select to authenticated
using (
  exists (
    select 1 from circulos c
    where c.inmueble_id = inmuebles.id
      and tiene_membresia_circulo(c.id)
  )
);

-- 6. Mensajes del sistema y edición/borrado lógico del autor
create policy mensajes_sistema_envio on mensajes
for insert to authenticated
with check (
  es_miembro_circulo(circulo_id)
  and tipo = 'sistema'
);

create policy mensajes_autor_actualizar on mensajes
for update to authenticated
using (autor_id = (select auth.uid()))
with check (autor_id = (select auth.uid()));

-- 7. Acuerdos y aceptación individual de aportaciones
create policy acuerdos_alta on acuerdos
for insert to authenticated
with check (es_miembro_circulo(circulo_id));

create policy acuerdos_actualizar on acuerdos
for update to authenticated
using (es_miembro_circulo(circulo_id))
with check (es_miembro_circulo(circulo_id));

create policy aportaciones_aceptar_propia on aportaciones
for update to authenticated
using (perfil_id = (select auth.uid()))
with check (perfil_id = (select auth.uid()));

-- 8. Permitir archivar matches a cualquiera de las dos partes
create policy matches_actualizar_partes on matches
for update to authenticated
using ((select auth.uid()) in (perfil_a_id, perfil_b_id))
with check ((select auth.uid()) in (perfil_a_id, perfil_b_id));

commit;
