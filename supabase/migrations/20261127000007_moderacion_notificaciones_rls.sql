-- ============================================================
-- Otoch v1.0.0 · Migración 007: moderación (M8), bitácora de auditoría
-- y emisión automática de notificaciones en tiempo real (M9)
-- ============================================================
begin;

-- 1. Índices adicionales para consultas del panel de moderación y auditoría
create index if not exists idx_verificaciones_estado_fecha
  on verificaciones (estado, creado_en desc);

create index if not exists idx_auditoria_fecha
  on auditoria (creado_en desc);

-- 2. Políticas RLS para administración / moderación (exclusivas para rol = 'administrador')
create policy perfiles_admin_lectura on perfiles
for select to authenticated
using (es_admin());

create policy perfiles_admin_actualizar on perfiles
for update to authenticated
using (es_admin())
with check (es_admin());

create policy arrendador_admin_actualizar on perfiles_arrendador
for update to authenticated
using (es_admin())
with check (es_admin());

create policy reportes_admin_actualizar on reportes
for update to authenticated
using (es_admin())
with check (es_admin());

create policy inmuebles_admin_lectura on inmuebles
for select to authenticated
using (es_admin());

create policy inmuebles_admin_actualizar on inmuebles
for update to authenticated
using (es_admin())
with check (es_admin());

create policy mensajes_admin_lectura on mensajes
for select to authenticated
using (es_admin());

create policy mensajes_admin_actualizar on mensajes
for update to authenticated
using (es_admin())
with check (es_admin());

-- Bitácora de auditoría: alta permitida únicamente al administrador autenticado (sin UPDATE ni DELETE: inmutable)
create policy auditoria_admin_alta on auditoria
for insert to authenticated
with check (
  es_admin()
  and actor_id = (select auth.uid())
);

-- Evaluación directa de notificaciones para Supabase Realtime (walrus)
create policy notificaciones_lectura_directa on notificaciones
for select to authenticated
using (perfil_id = (select auth.uid()));

-- 3. Disparadores automáticos para poblar `notificaciones` sin exponer INSERT directo al cliente

-- 3.1 Nuevo match (roomies o estudiante_inmueble)
create or replace function fn_notificar_nuevo_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo_inmueble text;
  v_nombre_a text;
  v_nombre_b text;
  v_comp text;
begin
  select trim(nombre || ' ' || apellidos) into v_nombre_a from perfiles where id = new.perfil_a_id;
  select trim(nombre || ' ' || apellidos) into v_nombre_b from perfiles where id = new.perfil_b_id;

  if new.tipo = 'roomies' then
    v_comp := case
      when new.compatibilidad is not null then ' (' || round(new.compatibilidad)::text || '% compatibles)'
      else ''
    end;

    insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
    values
      (
        new.perfil_a_id,
        'nuevo_match',
        '¡Nuevo match de roomie!',
        left('Hiciste match con ' || coalesce(v_nombre_b, 'un estudiante') || v_comp || '. Invítalo a un círculo.', 500),
        jsonb_build_object('match_id', new.id, 'tipo_match', new.tipo, 'href', '/matches')
      ),
      (
        new.perfil_b_id,
        'nuevo_match',
        '¡Nuevo match de roomie!',
        left('Hiciste match con ' || coalesce(v_nombre_a, 'un estudiante') || v_comp || '. Invítalo a un círculo.', 500),
        jsonb_build_object('match_id', new.id, 'tipo_match', new.tipo, 'href', '/matches')
      );
  else
    select titulo into v_titulo_inmueble from inmuebles where id = new.inmueble_id;

    insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
    values
      (
        new.perfil_a_id,
        'nuevo_match',
        '¡Match confirmado en inmueble!',
        left('Ya puedes abrir un círculo para ' || coalesce(v_titulo_inmueble, 'el inmueble seleccionado') || '.', 500),
        jsonb_build_object('match_id', new.id, 'inmueble_id', new.inmueble_id, 'href', '/matches')
      ),
      (
        new.perfil_b_id,
        'nuevo_match',
        '¡Nuevo interesado con match!',
        left(coalesce(v_nombre_a, 'Un estudiante') || ' hizo match en ' || coalesce(v_titulo_inmueble, 'tu inmueble') || '.', 500),
        jsonb_build_object('match_id', new.id, 'inmueble_id', new.inmueble_id, 'href', '/matches')
      );
  end if;

  return new;
end;
$$;

revoke execute on function fn_notificar_nuevo_match() from public, anon, authenticated;

create trigger trg_matches_notificar
after insert on matches
for each row execute function fn_notificar_nuevo_match();

-- 3.2 Nuevo mensaje en el chat del círculo
create or replace function fn_notificar_nuevo_mensaje()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre_circulo text;
  v_nombre_autor text;
  v_resumen text;
begin
  if new.eliminado or new.tipo = 'sistema' then
    return new;
  end if;

  select coalesce(c.nombre, i.titulo, 'Tu círculo')
    into v_nombre_circulo
  from circulos c
  left join inmuebles i on i.id = c.inmueble_id
  where c.id = new.circulo_id;

  if new.autor_id is not null then
    select trim(nombre || ' ' || apellidos) into v_nombre_autor
    from perfiles
    where id = new.autor_id;
  end if;

  v_resumen := case
    when new.tipo = 'imagen' and (new.contenido is null or btrim(new.contenido) = '')
      then coalesce(v_nombre_autor, 'Un integrante') || ' compartió una imagen.'
    else coalesce(v_nombre_autor, 'Integrante') || ': ' || coalesce(new.contenido, '')
  end;

  insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
  select
    m.perfil_id,
    'mensaje',
    left('Nuevo mensaje en ' || coalesce(v_nombre_circulo, 'tu círculo'), 120),
    left(v_resumen, 500),
    jsonb_build_object(
      'circulo_id', new.circulo_id,
      'mensaje_id', new.id,
      'href', '/circulos/' || new.circulo_id::text
    )
  from miembros_circulo m
  where m.circulo_id = new.circulo_id
    and m.estado = 'activo'
    and m.perfil_id is distinct from new.autor_id
    and not exists (
      select 1 from bloqueos b
      where (b.bloqueador_id = m.perfil_id and b.bloqueado_id = new.autor_id)
         or (b.bloqueador_id = new.autor_id and b.bloqueado_id = m.perfil_id)
    );

  return new;
end;
$$;

revoke execute on function fn_notificar_nuevo_mensaje() from public, anon, authenticated;

create trigger trg_mensajes_notificar
after insert on mensajes
for each row execute function fn_notificar_nuevo_mensaje();

-- 3.3 Invitación a círculo
create or replace function fn_notificar_invitacion_circulo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre_circulo text;
begin
  if new.estado <> 'invitado' then
    return new;
  end if;

  select coalesce(c.nombre, i.titulo, 'un círculo de Otoch')
    into v_nombre_circulo
  from circulos c
  left join inmuebles i on i.id = c.inmueble_id
  where c.id = new.circulo_id;

  insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
  values (
    new.perfil_id,
    'acuerdo',
    'Invitación a un círculo',
    left('Te invitaron a unirte a ' || coalesce(v_nombre_circulo, 'un círculo') || ' para dividir la renta.', 500),
    jsonb_build_object(
      'circulo_id', new.circulo_id,
      'href', '/circulos/' || new.circulo_id::text
    )
  );

  return new;
end;
$$;

revoke execute on function fn_notificar_invitacion_circulo() from public, anon, authenticated;

create trigger trg_miembros_invitacion_notificar
after insert on miembros_circulo
for each row execute function fn_notificar_invitacion_circulo();

-- 3.4 Cambios en el pre-acuerdo del círculo
create or replace function fn_notificar_cambio_acuerdo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre_circulo text;
  v_titulo text;
  v_cuerpo text;
  v_actor uuid;
begin
  if tg_op = 'UPDATE' and old.estado is not distinct from new.estado then
    return new;
  end if;

  v_actor := auth.uid();

  select coalesce(c.nombre, i.titulo, 'tu círculo')
    into v_nombre_circulo
  from circulos c
  left join inmuebles i on i.id = c.inmueble_id
  where c.id = new.circulo_id;

  if new.estado = 'propuesto' then
    v_titulo := 'Pre-acuerdo propuesto en ' || v_nombre_circulo;
    v_cuerpo := 'Revisa y acepta tu aportación mensual en el pre-acuerdo del círculo.';
  elsif new.estado = 'aceptado' then
    v_titulo := '¡Pre-acuerdo aceptado por todos!';
    v_cuerpo := 'Todos los integrantes aceptaron el reparto en ' || v_nombre_circulo || '. Ya puedes descargar el PDF.';
  elsif new.estado = 'rechazado' then
    v_titulo := 'Pre-acuerdo actualizado en ' || v_nombre_circulo;
    v_cuerpo := 'Se solicitaron ajustes sobre el pre-acuerdo del círculo.';
  else
    v_titulo := 'Borrador de acuerdo en ' || v_nombre_circulo;
    v_cuerpo := 'Se configuró la calculadora de reparto en partes iguales.';
  end if;

  insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
  select
    m.perfil_id,
    'acuerdo',
    left(v_titulo, 120),
    left(v_cuerpo, 500),
    jsonb_build_object(
      'circulo_id', new.circulo_id,
      'acuerdo_id', new.id,
      'estado', new.estado,
      'href', '/circulos/' || new.circulo_id::text || '/acuerdo'
    )
  from miembros_circulo m
  where m.circulo_id = new.circulo_id
    and m.estado = 'activo'
    and (new.estado = 'aceptado' or m.perfil_id is distinct from v_actor);

  return new;
end;
$$;

revoke execute on function fn_notificar_cambio_acuerdo() from public, anon, authenticated;

create trigger trg_acuerdos_notificar
after insert or update of estado on acuerdos
for each row execute function fn_notificar_cambio_acuerdo();

-- 3.5 Resultado de revisión de verificación (aprobada / rechazada)
create or replace function fn_notificar_revision_verificacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etiqueta_tipo text;
  v_titulo text;
  v_cuerpo text;
begin
  if old.estado is not distinct from new.estado or new.estado = 'pendiente' then
    return new;
  end if;

  v_etiqueta_tipo := case new.tipo
    when 'correo_institucional' then 'correo institucional'
    when 'identidad' then 'identificación oficial'
    when 'propiedad' then 'acreditación de propiedad'
    else 'documento'
  end;

  if new.estado = 'aprobada' then
    v_titulo := 'Verificación aprobada';
    v_cuerpo := 'Tu ' || v_etiqueta_tipo || ' fue revisada y aprobada por el equipo de Otoch.';
  else
    v_titulo := 'Verificación rechazada';
    v_cuerpo := 'Tu ' || v_etiqueta_tipo || ' requiere corrección'
      || case
           when new.motivo_rechazo is not null and btrim(new.motivo_rechazo) <> ''
             then ': ' || new.motivo_rechazo
           else '.'
         end;
  end if;

  insert into notificaciones (perfil_id, tipo, titulo, cuerpo, datos)
  values (
    new.perfil_id,
    'verificacion',
    left(v_titulo, 120),
    left(v_cuerpo, 500),
    jsonb_build_object(
      'verificacion_id', new.id,
      'tipo_verificacion', new.tipo,
      'estado', new.estado,
      'href', '/perfil'
    )
  );

  return new;
end;
$$;

revoke execute on function fn_notificar_revision_verificacion() from public, anon, authenticated;

create trigger trg_verificaciones_notificar
after update of estado on verificaciones
for each row execute function fn_notificar_revision_verificacion();

commit;
