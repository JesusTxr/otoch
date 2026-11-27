-- Otoch v1.0.0 · Scripts de reversión (ejecutar en orden inverso: 003 → 002 → 001)
-- ADVERTENCIA: la reversión de la migración 001 elimina datos. Exportar antes de ejecutar.

-- 003_down
begin;
drop trigger if exists trg_swipes_match on swipes;
drop trigger if exists trg_perfiles_upd on perfiles;
drop trigger if exists trg_inmuebles_upd on inmuebles;
drop trigger if exists trg_circulos_upd on circulos;
drop trigger if exists trg_acuerdos_upd on acuerdos;
drop function if exists repartir_partes_iguales(uuid);
drop function if exists crear_match_si_mutuo();
drop function if exists compatibilidad(uuid, uuid);
drop function if exists tocar_actualizado_en();
commit;

-- 002_down (deja las tablas sin políticas; usar solo como paso previo a 001_down)
begin;
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop; end $$;
drop function if exists es_miembro_circulo(uuid);
drop function if exists es_admin();
commit;

-- 001_down
begin;
alter publication supabase_realtime drop table mensajes, notificaciones, miembros_circulo;
drop table if exists auditoria cascade;
drop table if exists suscripciones_push cascade;
drop table if exists notificaciones cascade;
drop table if exists bloqueos cascade;
drop table if exists reportes cascade;
drop table if exists verificaciones cascade;
drop table if exists aportaciones cascade;
drop table if exists acuerdos cascade;
drop table if exists mensajes cascade;
drop table if exists miembros_circulo cascade;
drop table if exists circulos cascade;
drop table if exists matches cascade;
drop table if exists swipes cascade;
drop table if exists fotos_inmueble cascade;
drop table if exists inmuebles cascade;
drop table if exists perfiles_arrendador cascade;
drop table if exists preferencias_convivencia cascade;
drop table if exists perfiles_estudiante cascade;
drop table if exists perfiles cascade;
drop table if exists municipios cascade;
drop table if exists universidades cascade;
drop type if exists estado_reporte;
drop type if exists motivo_reporte;
drop type if exists estado_revision;
drop type if exists tipo_verificacion;
drop type if exists estado_acuerdo;
drop type if exists tipo_mensaje;
drop type if exists estado_miembro;
drop type if exists rol_circulo;
drop type if exists estado_circulo;
drop type if exists estado_match;
drop type if exists tipo_match;
drop type if exists decision_swipe;
drop type if exists estado_inmueble;
drop type if exists tipo_inmueble;
drop type if exists tipo_arrendador;
drop type if exists preferencia_roomie;
drop type if exists horario_sueno;
drop type if exists estado_verificacion;
drop type if exists genero;
drop type if exists rol_usuario;
commit;
