export type RolUsuario = "estudiante" | "arrendador" | "administrador";
export type RolRegistro = "estudiante" | "arrendador";
export type Genero = "mujer" | "hombre" | "no_binario" | "prefiero_no_decir";
export type EstadoVerificacion = "pendiente" | "verificado" | "rechazado";
export type HorarioSueno = "temprano" | "regular" | "nocturno";
export type PreferenciaRoomie = "indistinto" | "mismo_genero";
export type TipoArrendador = "persona_fisica" | "inmobiliaria";
export type TipoInmueble = "casa" | "departamento" | "cuarto";
export type EstadoInmueble = "borrador" | "publicado" | "pausado" | "rentado";
export type DecisionSwipe = "me_interesa" | "descartar";
export type TipoMatch = "estudiante_inmueble" | "roomies";
export type EstadoMatch = "activo" | "archivado";
export type EstadoCirculo = "abierto" | "en_acuerdo" | "cerrado" | "cancelado";
export type RolCirculo = "arrendador" | "estudiante";
export type EstadoMiembro = "invitado" | "activo" | "salio";
export type TipoMensaje = "texto" | "imagen" | "sistema";
export type EstadoAcuerdo = "borrador" | "propuesto" | "aceptado" | "rechazado";
export type MotivoReporte =
  | "fraude"
  | "acoso"
  | "contenido_inapropiado"
  | "suplantacion"
  | "otro";
export type TipoVerificacion =
  | "correo_institucional"
  | "identidad"
  | "propiedad";
export type EstadoRevision = "pendiente" | "aprobada" | "rechazada";
export type EstadoReporte =
  | "abierto"
  | "en_revision"
  | "resuelto"
  | "descartado";
export type CategoriaNotificacion =
  | "nuevo_match"
  | "mensaje"
  | "acuerdo"
  | "verificacion";

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Universidad {
  id: string;
  nombre: string;
  siglas: string | null;
  campus: string | null;
  dominio_correo: string | null;
  ubicacion?: unknown;
  activa: boolean;
}

export interface Municipio {
  id: number;
  clave_inegi: string;
  nombre: string;
  distancia_merida_km: number | null;
}

export interface Perfil {
  id: string;
  rol: RolUsuario;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: Genero | null;
  telefono: string | null;
  foto_ruta: string | null;
  biografia: string | null;
  estado_verificacion: EstadoVerificacion;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

export interface PerfilEstudiante {
  perfil_id: string;
  universidad_id: string;
  municipio_origen_id: number | null;
  carrera: string | null;
  periodo_actual: number | null;
  correo_institucional: string | null;
  presupuesto_max: number;
  fecha_mudanza: string | null;
  busca_roomies: boolean;
  max_roomies: number;
}

export interface PreferenciasConvivencia {
  perfil_id: string;
  horario_sueno: HorarioSueno;
  limpieza: number;
  tolerancia_ruido: number;
  frecuencia_visitas: number;
  estudia_en_casa: number;
  fuma: boolean;
  tiene_mascota: boolean;
  acepta_mascotas: boolean;
  preferencia_roomie: PreferenciaRoomie;
  intereses: string[];
  actualizado_en: string;
}

export interface PerfilArrendador {
  perfil_id: string;
  tipo: TipoArrendador;
  nombre_comercial: string | null;
  identidad_verificada: boolean;
  propiedad_verificada: boolean;
}

export interface FotoInmueble {
  id: string;
  inmueble_id: string;
  ruta_storage: string;
  orden: number;
  creado_en: string;
}

export interface Inmueble {
  id: string;
  arrendador_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoInmueble;
  colonia: string;
  direccion_privada?: string | null;
  ubicacion: unknown;
  renta_mensual: number;
  deposito: number;
  capacidad: number;
  habitaciones: number;
  banos: number;
  amueblado: boolean;
  servicios_incluidos: string[];
  reglas: string | null;
  disponible_desde: string;
  estado: EstadoInmueble;
  creado_en: string;
  actualizado_en: string;
}

export interface InmuebleConDetalle extends Inmueble {
  coordenadas: Coordenadas;
  fotosUrls: string[];
  rentaPorPersona: number;
  arrendadorNombre: string;
  arrendadorIniciales: string;
  arrendadorVerificado: boolean;
  interesadosCount: number;
}

export interface Swipe {
  id: number;
  autor_id: string;
  inmueble_id: string | null;
  perfil_objetivo_id: string | null;
  decision: DecisionSwipe;
  creado_en: string;
}

export interface Match {
  id: string;
  tipo: TipoMatch;
  perfil_a_id: string;
  perfil_b_id: string;
  inmueble_id: string | null;
  compatibilidad: number | null;
  estado: EstadoMatch;
  creado_en: string;
}

export interface Circulo {
  id: string;
  inmueble_id: string;
  creado_por: string;
  nombre: string | null;
  cupo: number;
  estado: EstadoCirculo;
  creado_en: string;
  actualizado_en: string;
}

export interface MiembroCirculo {
  circulo_id: string;
  perfil_id: string;
  rol: RolCirculo;
  estado: EstadoMiembro;
  unido_en: string | null;
}

export interface MiembroCirculoDetalle extends MiembroCirculo {
  nombreCompleto: string;
  iniciales: string;
  esUsuarioActual: boolean;
  verificado: boolean;
  subtitulo: string;
  telefono: string | null;
}

export interface MensajeChat {
  id: number;
  circulo_id: string;
  autor_id: string | null;
  tipo: TipoMensaje;
  contenido: string | null;
  adjunto_ruta: string | null;
  eliminado: boolean;
  creado_en: string;
}

export interface Acuerdo {
  id: string;
  circulo_id: string;
  version: number;
  renta_total: number;
  deposito_total: number;
  servicios_estimados: number;
  fecha_inicio: string;
  duracion_meses: number;
  clausulas: string[];
  estado: EstadoAcuerdo;
  pdf_ruta: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Aportacion {
  acuerdo_id: string;
  perfil_id: string;
  porcentaje: number;
  monto_renta: number;
  monto_deposito: number;
  aceptado_en: string | null;
}

export interface CirculoResumenLista {
  id: string;
  nombre: string;
  estado: EstadoCirculo;
  cupo: number;
  miEstado: EstadoMiembro;
  miRol: RolCirculo;
  inmuebleId: string;
  inmuebleTitulo: string;
  inmuebleColonia: string;
  rentaMensual: number;
  avatares: { iniciales: string; nombre: string; esArrendador: boolean }[];
  ultimoMensajeTexto: string;
  ultimoMensajeFecha: string;
  estudiantesActivos: number;
}

export interface MatchInmuebleItem {
  matchId: string;
  inmuebleId: string;
  inmuebleTitulo: string;
  inmuebleColonia: string;
  rentaMensual: number;
  capacidad: number;
  contraparteId: string;
  contraparteNombre: string;
  contraparteIniciales: string;
  contraparteEsArrendador: boolean;
  circuloExistenteId: string | null;
  creadoEn: string;
}

export interface MatchRoomieItem {
  matchId: string;
  roomieId: string;
  nombreCompleto: string;
  iniciales: string;
  universidadSiglas: string;
  carrera: string;
  presupuestoMax: number | null;
  compatibilidad: number;
  verificado: boolean;
  creadoEn: string;
}

export interface RoomieCandidato {
  perfilId: string;
  nombre: string;
  apellidos: string;
  iniciales: string;
  edad: number;
  genero: Genero | null;
  biografia: string | null;
  verificado: boolean;
  universidadId: string;
  universidadSiglas: string;
  municipioOrigen: string | null;
  carrera: string;
  periodoActual: number | null;
  presupuestoMax: number;
  fechaMudanza: string | null;
  maxRoomies: number;
  preferencias: PreferenciasConvivencia;
  compatibilidadTotal: number;
  desglose: {
    horarios: number;
    limpieza: number;
    presupuesto: number;
    ruidoVisitas: number;
    mascotas: number;
  };
}

export interface Verificacion {
  id: string;
  perfil_id: string;
  tipo: TipoVerificacion;
  estado: EstadoRevision;
  evidencia_ruta: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  motivo_rechazo: string | null;
  creado_en: string;
}

export interface Notificacion {
  id: number;
  perfil_id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  datos: Record<string, unknown>;
  leida: boolean;
  creado_en: string;
}

export interface VerificacionModeracion extends Verificacion {
  solicitanteNombre: string;
  solicitanteIniciales: string;
  solicitanteRol: RolUsuario;
  solicitanteEstadoPerfil: EstadoVerificacion;
  correoInstitucional: string | null;
  universidadSiglas: string | null;
  nombreComercial: string | null;
}

export interface ReporteModeracion {
  id: string;
  reportante_id: string;
  reportanteNombre: string;
  perfil_reportado_id: string | null;
  perfilReportadoNombre: string | null;
  inmueble_reportado_id: string | null;
  inmuebleReportadoTitulo: string | null;
  mensaje_id: number | null;
  mensajeExtracto: string | null;
  motivo: MotivoReporte;
  descripcion: string | null;
  estado: EstadoReporte;
  resuelto_por: string | null;
  creado_en: string;
  resuelto_en: string | null;
}

export interface RegistroAuditoria {
  id: number;
  actor_id: string | null;
  actorNombre: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown>;
  creado_en: string;
}

export interface UsuarioSesionResumen {
  id: string;
  email: string;
  nombreCompleto: string;
  iniciales: string;
  rol: RolUsuario | null;
  subtitulo: string;
  verificado: boolean;
  circulosActivos: number;
  notificacionesNoLeidas: number;
}
