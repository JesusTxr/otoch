-- Otoch v1.0.0 · Migración 002: seguridad a nivel de fila (RLS)
-- Regla del proyecto: ninguna tabla del esquema public queda sin RLS (lección LA-01).
begin;

alter table universidades enable row level security;
alter table municipios enable row level security;
alter table perfiles enable row level security;
alter table perfiles_estudiante enable row level security;
alter table preferencias_convivencia enable row level security;
alter table perfiles_arrendador enable row level security;
alter table inmuebles enable row level security;
alter table fotos_inmueble enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table circulos enable row level security;
alter table miembros_circulo enable row level security;
alter table mensajes enable row level security;
alter table acuerdos enable row level security;
alter table aportaciones enable row level security;
alter table verificaciones enable row level security;
alter table reportes enable row level security;
alter table bloqueos enable row level security;
alter table notificaciones enable row level security;
alter table suscripciones_push enable row level security;
alter table auditoria enable row level security;

-- Función auxiliar: ¿la persona autenticada es integrante activa del círculo?
create or replace function es_miembro_circulo(p_circulo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros_circulo m
                 where m.circulo_id = p_circulo and m.perfil_id = auth.uid() and m.estado = 'activo');
$$;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador');
$$;

-- Catálogos: lectura pública, escritura solo administración
create policy universidades_lectura on universidades for select using (activa);
create policy municipios_lectura on municipios for select using (true);
create policy universidades_admin on universidades for all using (es_admin()) with check (es_admin());

-- Perfiles: cada quien gestiona el suyo; lectura para personas autenticadas no bloqueadas
create policy perfiles_propio on perfiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy perfiles_lectura on perfiles for select to authenticated using (
  eliminado_en is null and not exists (select 1 from bloqueos b
    where (b.bloqueador_id = perfiles.id and b.bloqueado_id = auth.uid())
       or (b.bloqueador_id = auth.uid() and b.bloqueado_id = perfiles.id)));

create policy estudiante_propio on perfiles_estudiante for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy preferencias_propias on preferencias_convivencia for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy arrendador_propio on perfiles_arrendador for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- Inmuebles: públicos si están publicados; el arrendador administra los suyos
create policy inmuebles_publicados on inmuebles for select using (estado = 'publicado');
create policy inmuebles_propios on inmuebles for all using (arrendador_id = auth.uid()) with check (arrendador_id = auth.uid());
create policy fotos_lectura on fotos_inmueble for select using (
  exists (select 1 from inmuebles i where i.id = inmueble_id and (i.estado = 'publicado' or i.arrendador_id = auth.uid())));
create policy fotos_propias on fotos_inmueble for all using (
  exists (select 1 from inmuebles i where i.id = inmueble_id and i.arrendador_id = auth.uid()));

-- Swipes y matches: solo las partes involucradas
create policy swipes_propios on swipes for all using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy matches_partes on matches for select using (auth.uid() in (perfil_a_id, perfil_b_id));

-- Círculos, mensajes y acuerdos: solo integrantes activos
create policy circulos_miembros on circulos for select using (es_miembro_circulo(id) or creado_por = auth.uid());
create policy miembros_lectura on miembros_circulo for select using (es_miembro_circulo(circulo_id) or perfil_id = auth.uid());
create policy mensajes_lectura on mensajes for select using (es_miembro_circulo(circulo_id));
create policy mensajes_envio on mensajes for insert with check (es_miembro_circulo(circulo_id) and autor_id = auth.uid());
create policy acuerdos_miembros on acuerdos for select using (es_miembro_circulo(circulo_id));
create policy aportaciones_miembros on aportaciones for select using (
  exists (select 1 from acuerdos a where a.id = acuerdo_id and es_miembro_circulo(a.circulo_id)));

-- Verificaciones, reportes, bloqueos, notificaciones y push
create policy verificaciones_propias on verificaciones for select using (perfil_id = auth.uid() or es_admin());
create policy verificaciones_alta on verificaciones for insert with check (perfil_id = auth.uid());
create policy verificaciones_admin on verificaciones for update using (es_admin());
create policy reportes_alta on reportes for insert with check (reportante_id = auth.uid());
create policy reportes_admin on reportes for select using (es_admin() or reportante_id = auth.uid());
create policy bloqueos_propios on bloqueos for all using (bloqueador_id = auth.uid()) with check (bloqueador_id = auth.uid());
create policy notificaciones_propias on notificaciones for select using (perfil_id = auth.uid());
create policy notificaciones_leer on notificaciones for update using (perfil_id = auth.uid());
create policy push_propias on suscripciones_push for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy auditoria_admin on auditoria for select using (es_admin());

commit;
