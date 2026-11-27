import { z } from "zod";

export const tipoInmuebleValues = ["casa", "departamento", "cuarto"] as const;
export const estadoInmuebleValues = [
  "borrador",
  "publicado",
  "pausado",
  "rentado",
] as const;

export const inmuebleFormSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z
    .string()
    .trim()
    .min(5, "El título debe tener al menos 5 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  descripcion: z
    .string()
    .trim()
    .max(2000, "Máximo 2,000 caracteres.")
    .optional()
    .or(z.literal("")),
  tipo: z.enum(tipoInmuebleValues),
  colonia: z
    .string()
    .trim()
    .min(2, "Indica la colonia o fraccionamiento en Mérida.")
    .max(120, "Máximo 120 caracteres."),
  direccion_privada: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres.")
    .optional()
    .or(z.literal("")),
  lat: z
    .number()
    .min(20.7, "Selecciona una latitud dentro del área metropolitana de Mérida.")
    .max(21.35, "Selecciona una latitud dentro del área metropolitana de Mérida."),
  lng: z
    .number()
    .min(-89.9, "Selecciona una longitud dentro del área metropolitana de Mérida.")
    .max(-89.35, "Selecciona una longitud dentro del área metropolitana de Mérida."),
  renta_mensual: z
    .number()
    .positive("La renta mensual debe ser mayor a $0.")
    .max(200000, "Ingresa un monto mensual válido."),
  deposito: z
    .number()
    .min(0, "El depósito no puede ser negativo.")
    .max(200000, "Ingresa un depósito válido."),
  capacidad: z
    .number()
    .int()
    .min(1, "La capacidad mínima es de 1 persona.")
    .max(8, "La capacidad máxima es de 8 ocupantes."),
  habitaciones: z
    .number()
    .int()
    .min(1, "Debe tener al menos 1 habitación.")
    .max(12, "Máximo 12 habitaciones."),
  banos: z
    .number()
    .min(0.5, "Indica al menos medio baño (0.5).")
    .max(12, "Máximo 12 baños."),
  amueblado: z.boolean(),
  servicios_incluidos: z.array(z.string().trim().min(1)).max(15),
  reglas: z
    .string()
    .trim()
    .max(1500, "Máximo 1,500 caracteres.")
    .optional()
    .or(z.literal("")),
  disponible_desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona la fecha de disponibilidad."),
  estado: z.enum(estadoInmuebleValues),
  rutas_fotos: z.array(z.string().trim().min(1)).max(10).optional(),
});

export const swipeInputSchema = z
  .object({
    inmueble_id: z.string().uuid().nullable().optional(),
    perfil_objetivo_id: z.string().uuid().nullable().optional(),
    decision: z.enum(["me_interesa", "descartar"]),
  })
  .refine(
    (d) => Boolean(d.inmueble_id) || Boolean(d.perfil_objetivo_id),
    "Debes indicar un inmueble o un perfil a evaluar."
  );

export type InmuebleFormInput = z.infer<typeof inmuebleFormSchema>;
