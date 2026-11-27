import { z } from "zod";

export function esMayorDeEdad(fechaIso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaIso);
  if (!match) return false;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const nacimiento = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    nacimiento.getUTCFullYear() !== anio ||
    nacimiento.getUTCMonth() !== mes - 1 ||
    nacimiento.getUTCDate() !== dia
  ) {
    return false;
  }

  const hoy = new Date();
  const limite = new Date(
    Date.UTC(hoy.getUTCFullYear() - 18, hoy.getUTCMonth(), hoy.getUTCDate())
  );
  return nacimiento.getTime() <= limite.getTime();
}

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo electrónico.")
    .email("Ingresa un correo electrónico válido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const registroSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Ingresa tu correo electrónico.")
      .email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "Confirma tu contraseña."),
    rolInicial: z.enum(["estudiante", "arrendador"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const generoOptions = [
  "mujer",
  "hombre",
  "no_binario",
  "prefiero_no_decir",
] as const;

export const horarioSuenoOptions = ["temprano", "regular", "nocturno"] as const;
export const preferenciaRoomieOptions = ["indistinto", "mismo_genero"] as const;
export const tipoArrendadorOptions = ["persona_fisica", "inmobiliaria"] as const;
export const tipoVerificacionOptions = [
  "correo_institucional",
  "identidad",
  "propiedad",
] as const;

export const INTERESES_SUGERIDOS = [
  "Cocina en casa",
  "Videojuegos",
  "Deporte y gym",
  "Música",
  "Lectura",
  "Cine y series",
  "Plantas",
  "Café y estudio",
  "Fotografía",
  "Ciclismo",
] as const;

export const perfilBaseSchema = z.object({
  rol: z.enum(["estudiante", "arrendador"]),
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre (mínimo 2 caracteres).")
    .max(80, "Máximo 80 caracteres."),
  apellidos: z
    .string()
    .trim()
    .min(2, "Ingresa tus apellidos (mínimo 2 caracteres).")
    .max(120, "Máximo 120 caracteres."),
  fecha_nacimiento: z
    .string()
    .min(1, "Selecciona tu fecha de nacimiento.")
    .refine(esMayorDeEdad, {
      message: "Debes ser mayor de 18 años para usar Otoch.",
    }),
  genero: z.enum(generoOptions).nullable().optional(),
  telefono: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres.")
    .optional()
    .or(z.literal("")),
  biografia: z
    .string()
    .trim()
    .max(500, "La biografía no puede exceder 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export const perfilEstudianteSchema = z.object({
  universidad_id: z.string().uuid("Selecciona tu universidad."),
  municipio_origen_id: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  carrera: z
    .string()
    .trim()
    .min(2, "Indica tu carrera o programa académico.")
    .max(120, "Máximo 120 caracteres."),
  periodo_actual: z
    .number()
    .int()
    .min(1, "El periodo debe estar entre 1 y 12.")
    .max(12, "El periodo debe estar entre 1 y 12."),
  correo_institucional: z
    .string()
    .trim()
    .email("Ingresa un correo institucional válido.")
    .max(120, "Máximo 120 caracteres.")
    .optional()
    .or(z.literal("")),
  presupuesto_max: z
    .number()
    .positive("Ingresa un presupuesto mensual mayor a $0.")
    .max(100000, "Ingresa un monto mensual válido."),
  fecha_mudanza: z.string().optional().or(z.literal("")),
  busca_roomies: z.boolean(),
  max_roomies: z
    .number()
    .int()
    .min(1, "Mínimo 1 roomie.")
    .max(5, "Máximo 5 roomies."),
});

export const preferenciasConvivenciaSchema = z.object({
  horario_sueno: z.enum(horarioSuenoOptions),
  limpieza: z.number().int().min(1).max(5),
  tolerancia_ruido: z.number().int().min(1).max(5),
  frecuencia_visitas: z.number().int().min(1).max(5),
  estudia_en_casa: z.number().int().min(1).max(5),
  fuma: z.boolean(),
  tiene_mascota: z.boolean(),
  acepta_mascotas: z.boolean(),
  preferencia_roomie: z.enum(preferenciaRoomieOptions),
  intereses: z.array(z.string().trim().min(1)).max(12),
});

export const perfilArrendadorSchema = z
  .object({
    tipo: z.enum(tipoArrendadorOptions),
    nombre_comercial: z
      .string()
      .trim()
      .max(120, "Máximo 120 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      data.tipo !== "inmobiliaria" ||
      Boolean(data.nombre_comercial && data.nombre_comercial.trim().length >= 2),
    {
      message: "Ingresa el nombre comercial de la inmobiliaria.",
      path: ["nombre_comercial"],
    }
  );

export const onboardingEstudianteSchema = z.object({
  perfil: perfilBaseSchema.extend({ rol: z.literal("estudiante") }),
  estudiante: perfilEstudianteSchema,
  preferencias: preferenciasConvivenciaSchema,
});

export const onboardingArrendadorSchema = z.object({
  perfil: perfilBaseSchema.extend({ rol: z.literal("arrendador") }),
  arrendador: perfilArrendadorSchema,
});

export const onboardingPayloadSchema = z.discriminatedUnion("rol", [
  z.object({
    rol: z.literal("estudiante"),
    perfil: perfilBaseSchema,
    estudiante: perfilEstudianteSchema,
    preferencias: preferenciasConvivenciaSchema,
  }),
  z.object({
    rol: z.literal("arrendador"),
    perfil: perfilBaseSchema,
    arrendador: perfilArrendadorSchema,
  }),
]);

export const verificacionSolicitudSchema = z.object({
  tipo: z.enum(tipoVerificacionOptions),
  evidencia_ruta: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
