import { z } from "zod";

export const crearCirculoSchema = z.object({
  matchId: z.string().uuid("Match inválido."),
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre del círculo debe tener al menos 3 caracteres.")
    .max(80, "Máximo 80 caracteres."),
  cupo: z
    .number()
    .int()
    .min(2, "El cupo mínimo de un círculo es de 2 estudiantes.")
    .max(6, "El cupo máximo de un círculo es de 6 estudiantes."),
});

export const invitarRoomieSchema = z.object({
  circuloId: z.string().uuid(),
  roomieId: z.string().uuid("Selecciona un roomie válido."),
});

export const responderInvitacionSchema = z.object({
  circuloId: z.string().uuid(),
  aceptar: z.boolean(),
});

export const enviarMensajeSchema = z
  .object({
    circuloId: z.string().uuid(),
    tipo: z.enum(["texto", "imagen"]),
    contenido: z
      .string()
      .trim()
      .max(2000, "El mensaje no puede superar 2,000 caracteres.")
      .optional()
      .or(z.literal("")),
    adjuntoRuta: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      (d.tipo === "texto" && Boolean(d.contenido && d.contenido.length > 0)) ||
      (d.tipo === "imagen" && Boolean(d.adjuntoRuta && d.adjuntoRuta.length > 0)),
    "Escribe un mensaje o adjunta una imagen."
  );

export const guardarAcuerdoSchema = z.object({
  circuloId: z.string().uuid(),
  renta_total: z
    .number()
    .positive("La renta total debe ser mayor a $0.")
    .max(250000),
  deposito_total: z
    .number()
    .min(0, "El depósito no puede ser negativo.")
    .max(250000),
  servicios_estimados: z
    .number()
    .min(0, "Los servicios estimados no pueden ser negativos.")
    .max(100000),
  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de inicio."),
  duracion_meses: z
    .number()
    .int()
    .min(1, "La duración mínima es de 1 mes.")
    .max(24, "La duración máxima es de 24 meses."),
  clausulas: z
    .array(z.string().trim().min(2).max(400))
    .max(20, "Máximo 20 cláusulas."),
});

export const motivoReporteValues = [
  "fraude",
  "acoso",
  "contenido_inapropiado",
  "suplantacion",
  "otro",
] as const;

export const crearReporteSchema = z.object({
  perfilReportadoId: z.string().uuid().nullable().optional(),
  inmuebleReportadoId: z.string().uuid().nullable().optional(),
  mensajeId: z.number().int().positive().nullable().optional(),
  motivo: z.enum(motivoReporteValues),
  descripcion: z
    .string()
    .trim()
    .min(5, "Describe brevemente el motivo del reporte.")
    .max(1000, "Máximo 1,000 caracteres."),
});

export const bloquearUsuarioSchema = z.object({
  bloqueadoId: z.string().uuid("Usuario inválido."),
});

export const CLAUSULAS_SUGERIDAS = [
  "La renta y los servicios compartidos se cubren puntualmente los primeros 5 días de cada mes.",
  "Horario de silencio en áreas comunes a partir de las 11:00 pm de domingo a jueves.",
  "Limpieza semanal rotativa de cocina, sala y baños entre los integrantes activos.",
  "El depósito en garantía es reembolsable al concluir el plazo acordado sin adeudos ni daños.",
] as const;
