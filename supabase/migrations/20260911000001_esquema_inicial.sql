-- ============================================================
-- Otoch v1.0.0 · Migración 001: esquema inicial
-- Motor: PostgreSQL 17 (Supabase) + PostGIS
-- Generado a partir de la fuente única del modelo de datos
-- ============================================================
begin;

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Tipos enumerados
create type rol_usuario as enum ('estudiante', 'arrendador', 'administrador');
create type genero as enum ('mujer', 'hombre', 'no_binario', 'prefiero_no_decir');
create type estado_verificacion as enum ('pendiente', 'verificado', 'rechazado');
create type horario_sueno as enum ('temprano', 'regular', 'nocturno');
create type preferencia_roomie as enum ('indistinto', 'mismo_genero');
create type tipo_arrendador as enum ('persona_fisica', 'inmobiliaria');
create type tipo_inmueble as enum ('casa', 'departamento', 'cuarto');
create type estado_inmueble as enum ('borrador', 'publicado', 'pausado', 'rentado');
create type decision_swipe as enum ('me_interesa', 'descartar');
create type tipo_match as enum ('estudiante_inmueble', 'roomies');
create type estado_match as enum ('activo', 'archivado');
create type estado_circulo as enum ('abierto', 'en_acuerdo', 'cerrado', 'cancelado');
create type rol_circulo as enum ('arrendador', 'estudiante');
create type estado_miembro as enum ('invitado', 'activo', 'salio');
create type tipo_mensaje as enum ('texto', 'imagen', 'sistema');
create type estado_acuerdo as enum ('borrador', 'propuesto', 'aceptado', 'rechazado');
create type tipo_verificacion as enum ('correo_institucional', 'identidad', 'propiedad');
create type estado_revision as enum ('pendiente', 'aprobada', 'rechazada');
create type motivo_reporte as enum ('fraude', 'acoso', 'contenido_inapropiado', 'suplantacion', 'otro');
create type estado_reporte as enum ('abierto', 'en_revision', 'resuelto', 'descartado');

-- Catálogo de instituciones de educación superior y sus campus.
create table universidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  siglas varchar(20),
  campus text,
  dominio_correo varchar(100) unique,
  ubicacion extensions.geography(Point,4326) not null,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);
comment on table universidades is 'Catálogo de instituciones de educación superior y sus campus.';
comment on column universidades.id is 'Identificador único.';
comment on column universidades.nombre is 'Nombre oficial de la institución.';
comment on column universidades.siglas is 'Siglas de la institución (p. ej., UTM, UADY).';
comment on column universidades.campus is 'Nombre o referencia del campus.';
comment on column universidades.dominio_correo is 'Dominio del correo institucional para verificar estudiantes.';
comment on column universidades.ubicacion is 'Coordenadas del campus (PostGIS) para filtrar por distancia.';
comment on column universidades.activa is 'Indica si se muestra en el catálogo.';
comment on column universidades.creado_en is 'Fecha y hora de alta.';

-- Catálogo de los municipios de Yucatán (origen de los estudiantes).
create table municipios (
  id smallint primary key,
  clave_inegi char(3) not null unique,
  nombre text not null,
  distancia_merida_km numeric(6,1) check (distancia_merida_km >= 0)
);
comment on table municipios is 'Catálogo de los municipios de Yucatán (origen de los estudiantes).';
comment on column municipios.id is 'Identificador del municipio.';
comment on column municipios.clave_inegi is 'Clave municipal del Marco Geoestadístico del INEGI.';
comment on column municipios.nombre is 'Nombre oficial del municipio.';
comment on column municipios.distancia_merida_km is 'Distancia aproximada por carretera a Mérida (analítica).';

-- Datos generales de cada persona usuaria; extiende auth.users de Supabase.
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol_usuario not null,
  nombre varchar(80) not null,
  apellidos varchar(120) not null,
  fecha_nacimiento date not null check (fecha_nacimiento <= current_date - interval '18 years'),
  genero genero,
  telefono varchar(20),
  foto_ruta text,
  biografia varchar(500),
  estado_verificacion estado_verificacion not null default 'pendiente',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz
);
comment on table perfiles is 'Datos generales de cada persona usuaria; extiende auth.users de Supabase.';
comment on column perfiles.id is 'Mismo identificador del usuario en Supabase Auth.';
comment on column perfiles.rol is 'Rol en la plataforma: estudiante, arrendador o administrador.';
comment on column perfiles.nombre is 'Nombre(s).';
comment on column perfiles.apellidos is 'Apellidos.';
comment on column perfiles.fecha_nacimiento is 'Valida la mayoría de edad (18 años o más).';
comment on column perfiles.genero is 'Dato opcional; solo se usa si la persona activa la preferencia de roomies del mismo género.';
comment on column perfiles.telefono is 'Teléfono de contacto; visible únicamente dentro de un círculo.';
comment on column perfiles.foto_ruta is 'Ruta de la foto de perfil en Storage.';
comment on column perfiles.biografia is 'Presentación breve.';
comment on column perfiles.estado_verificacion is 'Resultado global de la verificación de identidad.';
comment on column perfiles.creado_en is 'Fecha y hora de registro.';
comment on column perfiles.actualizado_en is 'Última actualización.';
comment on column perfiles.eliminado_en is 'Baja lógica para atender solicitudes de cancelación (derechos ARCO).';

-- Información académica y de búsqueda de cada estudiante.
create table perfiles_estudiante (
  perfil_id uuid primary key references perfiles(id) on delete cascade,
  universidad_id uuid not null references universidades(id),
  municipio_origen_id smallint references municipios(id),
  carrera varchar(120),
  periodo_actual smallint check (periodo_actual between 1 and 12),
  correo_institucional varchar(120) unique,
  presupuesto_max numeric(10,2) not null check (presupuesto_max > 0),
  fecha_mudanza date,
  busca_roomies boolean not null default true,
  max_roomies smallint not null default 3 check (max_roomies between 1 and 5)
);
comment on table perfiles_estudiante is 'Información académica y de búsqueda de cada estudiante.';
comment on column perfiles_estudiante.perfil_id is 'Perfil al que pertenece (relación 1:1).';
comment on column perfiles_estudiante.universidad_id is 'Institución donde estudia.';
comment on column perfiles_estudiante.municipio_origen_id is 'Municipio de residencia familiar.';
comment on column perfiles_estudiante.carrera is 'Programa académico.';
comment on column perfiles_estudiante.periodo_actual is 'Cuatrimestre o semestre que cursa.';
comment on column perfiles_estudiante.correo_institucional is 'Correo verificado con el dominio de la universidad.';
comment on column perfiles_estudiante.presupuesto_max is 'Monto mensual máximo para su parte de la renta (MXN).';
comment on column perfiles_estudiante.fecha_mudanza is 'Fecha deseada de mudanza.';
comment on column perfiles_estudiante.busca_roomies is 'Indica si desea compartir vivienda.';
comment on column perfiles_estudiante.max_roomies is 'Número máximo de personas con quienes compartiría.';

-- Cuestionario de hábitos usado para calcular la compatibilidad entre roomies.
create table preferencias_convivencia (
  perfil_id uuid primary key references perfiles_estudiante(perfil_id) on delete cascade,
  horario_sueno horario_sueno not null,
  limpieza smallint not null check (limpieza between 1 and 5),
  tolerancia_ruido smallint not null check (tolerancia_ruido between 1 and 5),
  frecuencia_visitas smallint not null check (frecuencia_visitas between 1 and 5),
  estudia_en_casa smallint not null check (estudia_en_casa between 1 and 5),
  fuma boolean not null default false,
  tiene_mascota boolean not null default false,
  acepta_mascotas boolean not null default true,
  preferencia_roomie preferencia_roomie not null default 'indistinto',
  intereses text[] not null default '{}',
  actualizado_en timestamptz not null default now()
);
comment on table preferencias_convivencia is 'Cuestionario de hábitos usado para calcular la compatibilidad entre roomies.';
comment on column preferencias_convivencia.perfil_id is 'Estudiante que responde (1:1).';
comment on column preferencias_convivencia.horario_sueno is 'Horario de descanso: temprano, regular o nocturno.';
comment on column preferencias_convivencia.limpieza is 'Nivel de orden y limpieza esperado (escala 1-5).';
comment on column preferencias_convivencia.tolerancia_ruido is 'Tolerancia al ruido (1-5).';
comment on column preferencias_convivencia.frecuencia_visitas is 'Frecuencia esperada de visitas (1-5).';
comment on column preferencias_convivencia.estudia_en_casa is 'Tiempo de estudio en casa (1-5).';
comment on column preferencias_convivencia.fuma is 'Indica si fuma.';
comment on column preferencias_convivencia.tiene_mascota is 'Indica si tiene mascota.';
comment on column preferencias_convivencia.acepta_mascotas is 'Acepta convivir con mascotas.';
comment on column preferencias_convivencia.preferencia_roomie is 'Preferencia sobre el género de sus roomies.';
comment on column preferencias_convivencia.intereses is 'Etiquetas de intereses (música, deporte, videojuegos, etc.).';
comment on column preferencias_convivencia.actualizado_en is 'Última actualización del cuestionario.';

-- Datos y estado de verificación de cada arrendador.
create table perfiles_arrendador (
  perfil_id uuid primary key references perfiles(id) on delete cascade,
  tipo tipo_arrendador not null,
  nombre_comercial varchar(120),
  identidad_verificada boolean not null default false,
  propiedad_verificada boolean not null default false
);
comment on table perfiles_arrendador is 'Datos y estado de verificación de cada arrendador.';
comment on column perfiles_arrendador.perfil_id is 'Perfil al que pertenece (1:1).';
comment on column perfiles_arrendador.tipo is 'Persona física o inmobiliaria.';
comment on column perfiles_arrendador.nombre_comercial is 'Nombre comercial (solo inmobiliarias).';
comment on column perfiles_arrendador.identidad_verificada is 'La identificación oficial fue revisada y aprobada.';
comment on column perfiles_arrendador.propiedad_verificada is 'Se acreditó la propiedad o la facultad para arrendar.';

-- Casas, departamentos o cuartos publicados por los arrendadores.
create table inmuebles (
  id uuid primary key default gen_random_uuid(),
  arrendador_id uuid not null references perfiles_arrendador(perfil_id),
  titulo varchar(120) not null,
  descripcion text,
  tipo tipo_inmueble not null,
  colonia varchar(120) not null,
  direccion_privada text,
  ubicacion extensions.geography(Point,4326) not null,
  renta_mensual numeric(10,2) not null check (renta_mensual > 0),
  deposito numeric(10,2) not null default 0 check (deposito >= 0),
  capacidad smallint not null check (capacidad between 1 and 8),
  habitaciones smallint not null check (habitaciones >= 1),
  banos numeric(3,1) not null check (banos > 0),
  amueblado boolean not null default false,
  servicios_incluidos text[] not null default '{}',
  reglas text,
  disponible_desde date not null,
  estado estado_inmueble not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table inmuebles is 'Casas, departamentos o cuartos publicados por los arrendadores.';
comment on column inmuebles.id is 'Identificador único.';
comment on column inmuebles.arrendador_id is 'Arrendador que publica.';
comment on column inmuebles.titulo is 'Título del anuncio.';
comment on column inmuebles.descripcion is 'Descripción detallada.';
comment on column inmuebles.tipo is 'Casa, departamento o cuarto.';
comment on column inmuebles.colonia is 'Colonia o fraccionamiento (dato público).';
comment on column inmuebles.direccion_privada is 'Dirección exacta; solo visible para miembros de un círculo.';
comment on column inmuebles.ubicacion is 'Coordenadas; en público se muestran con desplazamiento aproximado.';
comment on column inmuebles.renta_mensual is 'Renta total mensual (MXN).';
comment on column inmuebles.deposito is 'Depósito en garantía (MXN).';
comment on column inmuebles.capacidad is 'Número máximo de ocupantes.';
comment on column inmuebles.habitaciones is 'Número de habitaciones.';
comment on column inmuebles.banos is 'Número de baños (admite medios baños).';
comment on column inmuebles.amueblado is 'Indica si se renta amueblado.';
comment on column inmuebles.servicios_incluidos is 'Servicios incluidos en la renta (agua, luz, gas, internet).';
comment on column inmuebles.reglas is 'Reglas de la vivienda.';
comment on column inmuebles.disponible_desde is 'Fecha a partir de la cual se puede ocupar.';
comment on column inmuebles.estado is 'Borrador, publicado, pausado o rentado.';
comment on column inmuebles.creado_en is 'Fecha y hora de creación.';
comment on column inmuebles.actualizado_en is 'Última actualización.';

-- Fotografías asociadas a cada inmueble.
create table fotos_inmueble (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null references inmuebles(id) on delete cascade,
  ruta_storage text not null,
  orden smallint not null default 0,
  creado_en timestamptz not null default now()
);
comment on table fotos_inmueble is 'Fotografías asociadas a cada inmueble.';
comment on column fotos_inmueble.id is 'Identificador único.';
comment on column fotos_inmueble.inmueble_id is 'Inmueble al que pertenece.';
comment on column fotos_inmueble.ruta_storage is 'Ruta del archivo en el bucket inmuebles.';
comment on column fotos_inmueble.orden is 'Posición en la galería.';
comment on column fotos_inmueble.creado_en is 'Fecha y hora de carga.';

-- Decisiones de deslizar (me interesa / descartar) sobre inmuebles o personas.
create table swipes (
  id bigint generated always as identity primary key,
  autor_id uuid not null references perfiles(id) on delete cascade,
  inmueble_id uuid references inmuebles(id) on delete cascade,
  perfil_objetivo_id uuid references perfiles(id) on delete cascade,
  decision decision_swipe not null,
  creado_en timestamptz not null default now(),
  check (num_nonnulls(inmueble_id, perfil_objetivo_id) >= 1),
  unique nulls not distinct (autor_id, inmueble_id, perfil_objetivo_id)
);
comment on table swipes is 'Decisiones de deslizar (me interesa / descartar) sobre inmuebles o personas.';
comment on column swipes.id is 'Identificador secuencial.';
comment on column swipes.autor_id is 'Persona que toma la decisión.';
comment on column swipes.inmueble_id is 'Inmueble evaluado (o contexto de la evaluación).';
comment on column swipes.perfil_objetivo_id is 'Persona evaluada (posible roomie o interesado).';
comment on column swipes.decision is 'Me interesa o descartar.';
comment on column swipes.creado_en is 'Fecha y hora de la decisión.';

-- Coincidencias mutuas estudiante-inmueble o entre roomies.
create table matches (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_match not null,
  perfil_a_id uuid not null references perfiles(id) on delete cascade,
  perfil_b_id uuid not null references perfiles(id) on delete cascade,
  inmueble_id uuid references inmuebles(id) on delete cascade,
  compatibilidad numeric(5,2) check (compatibilidad between 0 and 100),
  estado estado_match not null default 'activo',
  creado_en timestamptz not null default now(),
  check (perfil_a_id <> perfil_b_id),
  check (tipo = 'roomies' or inmueble_id is not null),
  unique nulls not distinct (tipo, perfil_a_id, perfil_b_id, inmueble_id)
);
comment on table matches is 'Coincidencias mutuas estudiante-inmueble o entre roomies.';
comment on column matches.id is 'Identificador único.';
comment on column matches.tipo is 'Estudiante-inmueble o roomies.';
comment on column matches.perfil_a_id is 'Estudiante (o primer roomie).';
comment on column matches.perfil_b_id is 'Arrendador (o segundo roomie).';
comment on column matches.inmueble_id is 'Inmueble asociado (obligatorio en estudiante-inmueble).';
comment on column matches.compatibilidad is 'Puntaje de compatibilidad al momento del match (%).';
comment on column matches.estado is 'Activo o archivado.';
comment on column matches.creado_en is 'Fecha y hora del match.';

-- Grupo de negociación formado por un arrendador y los estudiantes interesados en un inmueble.
create table circulos (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null references inmuebles(id),
  creado_por uuid not null references perfiles(id),
  nombre varchar(80),
  cupo smallint not null check (cupo between 2 and 6),
  estado estado_circulo not null default 'abierto',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table circulos is 'Grupo de negociación formado por un arrendador y los estudiantes interesados en un inmueble.';
comment on column circulos.id is 'Identificador único.';
comment on column circulos.inmueble_id is 'Inmueble en negociación.';
comment on column circulos.creado_por is 'Persona que creó el círculo.';
comment on column circulos.nombre is 'Nombre visible del círculo.';
comment on column circulos.cupo is 'Número máximo de estudiantes.';
comment on column circulos.estado is 'Abierto, en acuerdo, cerrado o cancelado.';
comment on column circulos.creado_en is 'Fecha y hora de creación.';
comment on column circulos.actualizado_en is 'Última actualización.';

-- Integrantes de cada círculo y su estado de participación.
create table miembros_circulo (
  circulo_id uuid references circulos(id) on delete cascade,
  perfil_id uuid references perfiles(id) on delete cascade,
  rol rol_circulo not null,
  estado estado_miembro not null default 'invitado',
  unido_en timestamptz,
  primary key (circulo_id, perfil_id)
);
comment on table miembros_circulo is 'Integrantes de cada círculo y su estado de participación.';
comment on column miembros_circulo.circulo_id is 'Círculo (parte de la llave primaria).';
comment on column miembros_circulo.perfil_id is 'Integrante (parte de la llave primaria).';
comment on column miembros_circulo.rol is 'Arrendador o estudiante.';
comment on column miembros_circulo.estado is 'Invitado, activo o salió.';
comment on column miembros_circulo.unido_en is 'Fecha y hora en que aceptó la invitación.';

-- Mensajes del chat en tiempo real de cada círculo.
create table mensajes (
  id bigint generated always as identity primary key,
  circulo_id uuid not null references circulos(id) on delete cascade,
  autor_id uuid references perfiles(id) on delete set null,
  tipo tipo_mensaje not null default 'texto',
  contenido varchar(2000),
  adjunto_ruta text,
  eliminado boolean not null default false,
  creado_en timestamptz not null default now()
);
comment on table mensajes is 'Mensajes del chat en tiempo real de cada círculo.';
comment on column mensajes.id is 'Identificador secuencial.';
comment on column mensajes.circulo_id is 'Círculo al que pertenece la conversación.';
comment on column mensajes.autor_id is 'Autor; nulo en mensajes del sistema.';
comment on column mensajes.tipo is 'Texto, imagen o sistema.';
comment on column mensajes.contenido is 'Texto del mensaje.';
comment on column mensajes.adjunto_ruta is 'Ruta de la imagen adjunta en Storage.';
comment on column mensajes.eliminado is 'Borrado lógico por su autor o por moderación.';
comment on column mensajes.creado_en is 'Fecha y hora de envío.';

-- Pre-acuerdos de renta y convivencia generados dentro de un círculo.
create table acuerdos (
  id uuid primary key default gen_random_uuid(),
  circulo_id uuid not null references circulos(id),
  version smallint not null default 1,
  renta_total numeric(10,2) not null check (renta_total > 0),
  deposito_total numeric(10,2) not null default 0,
  servicios_estimados numeric(10,2) not null default 0,
  fecha_inicio date not null,
  duracion_meses smallint not null check (duracion_meses between 1 and 24),
  clausulas jsonb not null default '[]',
  estado estado_acuerdo not null default 'borrador',
  pdf_ruta text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (circulo_id, version)
);
comment on table acuerdos is 'Pre-acuerdos de renta y convivencia generados dentro de un círculo.';
comment on column acuerdos.id is 'Identificador único.';
comment on column acuerdos.circulo_id is 'Círculo que negocia.';
comment on column acuerdos.version is 'Versión del pre-acuerdo (única por círculo).';
comment on column acuerdos.renta_total is 'Renta mensual total pactada (MXN).';
comment on column acuerdos.deposito_total is 'Depósito total pactado (MXN).';
comment on column acuerdos.servicios_estimados is 'Gasto mensual estimado de servicios (MXN).';
comment on column acuerdos.fecha_inicio is 'Inicio del arrendamiento.';
comment on column acuerdos.duracion_meses is 'Duración pactada en meses.';
comment on column acuerdos.clausulas is 'Condiciones y reglas de convivencia acordadas.';
comment on column acuerdos.estado is 'Borrador, propuesto, aceptado o rechazado.';
comment on column acuerdos.pdf_ruta is 'Ruta del PDF del pre-acuerdo generado.';
comment on column acuerdos.creado_en is 'Fecha y hora de creación.';
comment on column acuerdos.actualizado_en is 'Última actualización.';

-- Reparto de la renta y del depósito por integrante (partes iguales por defecto).
create table aportaciones (
  acuerdo_id uuid references acuerdos(id) on delete cascade,
  perfil_id uuid references perfiles(id),
  porcentaje numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  monto_renta numeric(10,2) not null,
  monto_deposito numeric(10,2) not null default 0,
  aceptado_en timestamptz,
  primary key (acuerdo_id, perfil_id)
);
comment on table aportaciones is 'Reparto de la renta y del depósito por integrante (partes iguales por defecto).';
comment on column aportaciones.acuerdo_id is 'Pre-acuerdo (parte de la llave primaria).';
comment on column aportaciones.perfil_id is 'Estudiante que aporta (parte de la llave primaria).';
comment on column aportaciones.porcentaje is 'Proporción que le corresponde (%).';
comment on column aportaciones.monto_renta is 'Monto mensual de renta a su cargo (MXN).';
comment on column aportaciones.monto_deposito is 'Parte del depósito a su cargo (MXN).';
comment on column aportaciones.aceptado_en is 'Fecha y hora en que aceptó el reparto.';

-- Solicitudes de verificación de correo institucional, identidad o propiedad.
create table verificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  tipo tipo_verificacion not null,
  estado estado_revision not null default 'pendiente',
  evidencia_ruta text,
  revisado_por uuid references perfiles(id),
  revisado_en timestamptz,
  motivo_rechazo varchar(300),
  creado_en timestamptz not null default now()
);
comment on table verificaciones is 'Solicitudes de verificación de correo institucional, identidad o propiedad.';
comment on column verificaciones.id is 'Identificador único.';
comment on column verificaciones.perfil_id is 'Persona que solicita la verificación.';
comment on column verificaciones.tipo is 'Correo institucional, identidad o propiedad.';
comment on column verificaciones.estado is 'Pendiente, aprobada o rechazada.';
comment on column verificaciones.evidencia_ruta is 'Ruta temporal del documento en un bucket privado; se elimina al concluir la revisión.';
comment on column verificaciones.revisado_por is 'Administrador que revisó.';
comment on column verificaciones.revisado_en is 'Fecha y hora de la revisión.';
comment on column verificaciones.motivo_rechazo is 'Motivo en caso de rechazo.';
comment on column verificaciones.creado_en is 'Fecha y hora de la solicitud.';

-- Denuncias de usuarios, anuncios o mensajes para moderación.
create table reportes (
  id uuid primary key default gen_random_uuid(),
  reportante_id uuid not null references perfiles(id),
  perfil_reportado_id uuid references perfiles(id),
  inmueble_reportado_id uuid references inmuebles(id),
  mensaje_id bigint references mensajes(id),
  motivo motivo_reporte not null,
  descripcion varchar(1000),
  estado estado_reporte not null default 'abierto',
  resuelto_por uuid references perfiles(id),
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);
comment on table reportes is 'Denuncias de usuarios, anuncios o mensajes para moderación.';
comment on column reportes.id is 'Identificador único.';
comment on column reportes.reportante_id is 'Persona que reporta.';
comment on column reportes.perfil_reportado_id is 'Persona reportada (opcional).';
comment on column reportes.inmueble_reportado_id is 'Anuncio reportado (opcional).';
comment on column reportes.mensaje_id is 'Mensaje reportado (opcional).';
comment on column reportes.motivo is 'Fraude, acoso, contenido inapropiado, suplantación u otro.';
comment on column reportes.descripcion is 'Detalle aportado por quien reporta.';
comment on column reportes.estado is 'Abierto, en revisión, resuelto o descartado.';
comment on column reportes.resuelto_por is 'Moderador que atendió el reporte.';
comment on column reportes.creado_en is 'Fecha y hora del reporte.';
comment on column reportes.resuelto_en is 'Fecha y hora de resolución.';

-- Bloqueos entre personas usuarias (impiden verse y escribirse).
create table bloqueos (
  bloqueador_id uuid references perfiles(id) on delete cascade,
  bloqueado_id uuid references perfiles(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);
comment on table bloqueos is 'Bloqueos entre personas usuarias (impiden verse y escribirse).';
comment on column bloqueos.bloqueador_id is 'Quien bloquea (parte de la llave primaria).';
comment on column bloqueos.bloqueado_id is 'Persona bloqueada (parte de la llave primaria).';
comment on column bloqueos.creado_en is 'Fecha y hora del bloqueo.';

-- Bandeja de notificaciones dentro de la aplicación.
create table notificaciones (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references perfiles(id) on delete cascade,
  tipo varchar(40) not null,
  titulo varchar(120) not null,
  cuerpo varchar(500),
  datos jsonb not null default '{}',
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);
comment on table notificaciones is 'Bandeja de notificaciones dentro de la aplicación.';
comment on column notificaciones.id is 'Identificador secuencial.';
comment on column notificaciones.perfil_id is 'Destinatario.';
comment on column notificaciones.tipo is 'Categoría (nuevo_match, mensaje, acuerdo, verificacion).';
comment on column notificaciones.titulo is 'Título visible.';
comment on column notificaciones.cuerpo is 'Texto de la notificación.';
comment on column notificaciones.datos is 'Datos para la navegación (identificadores relacionados).';
comment on column notificaciones.leida is 'Indica si ya fue leída.';
comment on column notificaciones.creado_en is 'Fecha y hora de emisión.';

-- Suscripciones de notificaciones push del navegador (Web Push).
create table suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent varchar(300),
  creado_en timestamptz not null default now()
);
comment on table suscripciones_push is 'Suscripciones de notificaciones push del navegador (Web Push).';
comment on column suscripciones_push.id is 'Identificador único.';
comment on column suscripciones_push.perfil_id is 'Propietario de la suscripción.';
comment on column suscripciones_push.endpoint is 'URL del servicio push del navegador.';
comment on column suscripciones_push.p256dh is 'Llave pública de cifrado del navegador.';
comment on column suscripciones_push.auth is 'Secreto de autenticación de la suscripción.';
comment on column suscripciones_push.user_agent is 'Navegador y dispositivo.';
comment on column suscripciones_push.creado_en is 'Fecha y hora de registro.';

-- Bitácora inmutable de acciones sensibles (verificaciones, moderación, cambios de rol).
create table auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid references perfiles(id) on delete set null,
  accion varchar(60) not null,
  entidad varchar(60) not null,
  entidad_id text,
  detalle jsonb not null default '{}',
  creado_en timestamptz not null default now()
);
comment on table auditoria is 'Bitácora inmutable de acciones sensibles (verificaciones, moderación, cambios de rol).';
comment on column auditoria.id is 'Identificador secuencial.';
comment on column auditoria.actor_id is 'Persona que ejecutó la acción.';
comment on column auditoria.accion is 'Operación realizada (p. ej., verificacion.aprobada).';
comment on column auditoria.entidad is 'Tabla o recurso afectado.';
comment on column auditoria.entidad_id is 'Identificador del registro afectado.';
comment on column auditoria.detalle is 'Datos de contexto (sin información sensible).';
comment on column auditoria.creado_en is 'Fecha y hora del evento.';

-- Índices
create index idx_universidades_ubicacion on universidades using gist (ubicacion);
create index idx_inmuebles_ubicacion on inmuebles using gist (ubicacion);
create index idx_inmuebles_estado_renta on inmuebles (estado, renta_mensual);
create index idx_fotos_inmueble on fotos_inmueble (inmueble_id, orden);
create index idx_swipes_objetivo_inmueble on swipes (inmueble_id) where inmueble_id is not null;
create index idx_swipes_objetivo_perfil on swipes (perfil_objetivo_id) where perfil_objetivo_id is not null;
create index idx_matches_a on matches (perfil_a_id);
create index idx_matches_b on matches (perfil_b_id);
create index idx_miembros_perfil on miembros_circulo (perfil_id);
create index idx_mensajes_circulo_fecha on mensajes (circulo_id, creado_en desc);
create index idx_notificaciones_perfil on notificaciones (perfil_id, leida, creado_en desc);
create index idx_reportes_estado on reportes (estado, creado_en);
create index idx_auditoria_entidad on auditoria (entidad, entidad_id);

-- Publicación de Realtime para el chat y las notificaciones
alter publication supabase_realtime add table mensajes, notificaciones, miembros_circulo;

commit;
