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
export type TipoVerificacion =
  | "correo_institucional"
  | "identidad"
  | "propiedad";
export type EstadoRevision = "pendiente" | "aprobada" | "rechazada";

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

export interface UsuarioSesionResumen {
  id: string;
  email: string;
  nombreCompleto: string;
  iniciales: string;
  rol: RolUsuario | null;
  subtitulo: string;
  verificado: boolean;
  circulosActivos: number;
}
