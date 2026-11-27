-- Otoch v1.0.0 · Migración 003: funciones de negocio
begin;

-- Compatibilidad entre dos estudiantes (0 a 100) a partir del cuestionario de convivencia.
create or replace function compatibilidad(p_a uuid, p_b uuid) returns numeric
language sql stable set search_path = public as $$
  select round(100 * (
      0.20 * (case when a.horario_sueno = b.horario_sueno then 1 else 0.4 end)
    + 0.20 * (1 - abs(a.limpieza - b.limpieza) / 4.0)
    + 0.15 * (1 - abs(a.tolerancia_ruido - b.tolerancia_ruido) / 4.0)
    + 0.10 * (1 - abs(a.frecuencia_visitas - b.frecuencia_visitas) / 4.0)
    + 0.10 * (1 - abs(a.estudia_en_casa - b.estudia_en_casa) / 4.0)
    + 0.15 * (case when a.fuma = b.fuma then 1 else 0 end)
    + 0.10 * (case when (a.tiene_mascota and not b.acepta_mascotas)
                     or (b.tiene_mascota and not a.acepta_mascotas) then 0 else 1 end)
  ), 2)
  from preferencias_convivencia a, preferencias_convivencia b
  where a.perfil_id = p_a and b.perfil_id = p_b;
$$;

-- Crea un match cuando existe interés mutuo (se ejecuta después de cada swipe positivo).
create or replace function crear_match_si_mutuo() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_arrendador uuid;
begin
  if new.decision <> 'me_interesa' then return new; end if;

  -- Caso 1: roomies (estudiante evalúa a estudiante)
  if new.perfil_objetivo_id is not null and new.inmueble_id is null then
    if exists (select 1 from swipes s where s.autor_id = new.perfil_objetivo_id
               and s.perfil_objetivo_id = new.autor_id and s.inmueble_id is null
               and s.decision = 'me_interesa') then
      insert into matches (tipo, perfil_a_id, perfil_b_id, compatibilidad)
      values ('roomies', least(new.autor_id, new.perfil_objetivo_id),
              greatest(new.autor_id, new.perfil_objetivo_id),
              compatibilidad(new.autor_id, new.perfil_objetivo_id))
      on conflict do nothing;
    end if;
    return new;
  end if;

  -- Caso 2: estudiante-inmueble (estudiante evalúa inmueble y el arrendador acepta al estudiante)
  select i.arrendador_id into v_arrendador from inmuebles i where i.id = new.inmueble_id;
  if new.perfil_objetivo_id is null then
    -- swipe del estudiante sobre el inmueble: ¿el arrendador ya lo aceptó?
    if exists (select 1 from swipes s where s.autor_id = v_arrendador and s.inmueble_id = new.inmueble_id
               and s.perfil_objetivo_id = new.autor_id and s.decision = 'me_interesa') then
      insert into matches (tipo, perfil_a_id, perfil_b_id, inmueble_id)
      values ('estudiante_inmueble', new.autor_id, v_arrendador, new.inmueble_id) on conflict do nothing;
    end if;
  elsif new.autor_id = v_arrendador then
    -- swipe del arrendador sobre un estudiante interesado en su inmueble
    if exists (select 1 from swipes s where s.autor_id = new.perfil_objetivo_id
               and s.inmueble_id = new.inmueble_id and s.perfil_objetivo_id is null
               and s.decision = 'me_interesa') then
      insert into matches (tipo, perfil_a_id, perfil_b_id, inmueble_id)
      values ('estudiante_inmueble', new.perfil_objetivo_id, v_arrendador, new.inmueble_id) on conflict do nothing;
    end if;
  end if;
  return new;
end; $$;

create trigger trg_swipes_match after insert on swipes
for each row execute function crear_match_si_mutuo();

-- Reparto de la renta en partes iguales entre los estudiantes activos del círculo.
create or replace function repartir_partes_iguales(p_acuerdo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_circulo uuid; v_renta numeric; v_deposito numeric; v_n int;
begin
  select circulo_id, renta_total, deposito_total into v_circulo, v_renta, v_deposito
  from acuerdos where id = p_acuerdo;
  if not es_miembro_circulo(v_circulo) then raise exception 'Acceso denegado'; end if;
  select count(*) into v_n from miembros_circulo
  where circulo_id = v_circulo and rol = 'estudiante' and estado = 'activo';
  if v_n = 0 then raise exception 'El círculo no tiene estudiantes activos'; end if;
  delete from aportaciones where acuerdo_id = p_acuerdo;
  insert into aportaciones (acuerdo_id, perfil_id, porcentaje, monto_renta, monto_deposito)
  select p_acuerdo, m.perfil_id, round(100.0 / v_n, 2), round(v_renta / v_n, 2), round(v_deposito / v_n, 2)
  from miembros_circulo m
  where m.circulo_id = v_circulo and m.rol = 'estudiante' and m.estado = 'activo';
end; $$;

-- Actualiza la marca de tiempo de modificación.
create or replace function tocar_actualizado_en() returns trigger language plpgsql as $$
begin new.actualizado_en := now(); return new; end; $$;
create trigger trg_perfiles_upd before update on perfiles for each row execute function tocar_actualizado_en();
create trigger trg_inmuebles_upd before update on inmuebles for each row execute function tocar_actualizado_en();
create trigger trg_circulos_upd before update on circulos for each row execute function tocar_actualizado_en();
create trigger trg_acuerdos_upd before update on acuerdos for each row execute function tocar_actualizado_en();

commit;
