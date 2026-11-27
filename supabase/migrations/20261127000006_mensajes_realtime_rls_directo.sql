-- Otoch v1.0.0 · Migración 006: política directa sobre mensajes para evaluación instantánea en Supabase Realtime
begin;

create policy mensajes_lectura_directa on mensajes
for select to authenticated
using (
  exists (
    select 1 from miembros_circulo m
    where m.circulo_id = mensajes.circulo_id
      and m.perfil_id = (select auth.uid())
      and m.estado = 'activo'
  )
);

commit;
