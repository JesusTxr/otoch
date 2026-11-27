import { describe, expect, it } from "vitest";
import {
  etiquetaCategoriaNotificacion,
  resolverDestinoNotificacion,
} from "./notificaciones-utils";
import type { Notificacion } from "@/types/database";

function crearNotifBase(overrides: Partial<Notificacion>): Notificacion {
  return {
    id: 1,
    perfil_id: "00000000-0000-0000-0000-000000000001",
    tipo: "nuevo_match",
    titulo: "Título de prueba",
    cuerpo: "Cuerpo de prueba",
    datos: {},
    leida: false,
    creado_en: "2026-11-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("notificaciones-utils", () => {
  it("resuelve rutas por categoría y respeta datos.href internos seguros", () => {
    expect(
      resolverDestinoNotificacion(crearNotifBase({ tipo: "nuevo_match" }))
    ).toBe("/matches");

    expect(
      resolverDestinoNotificacion(
        crearNotifBase({
          tipo: "mensaje",
          datos: { circulo_id: "abc-123" },
        })
      )
    ).toBe("/circulos/abc-123");

    expect(
      resolverDestinoNotificacion(
        crearNotifBase({
          tipo: "acuerdo",
          datos: { circulo_id: "abc-123" },
        })
      )
    ).toBe("/circulos/abc-123/acuerdo");

    expect(
      resolverDestinoNotificacion(crearNotifBase({ tipo: "verificacion" }))
    ).toBe("/perfil");

    // Ignora intentos de open-redirect externo ("//...")
    expect(
      resolverDestinoNotificacion(
        crearNotifBase({
          tipo: "verificacion",
          datos: { href: "//sitio-externo.malicioso" },
        })
      )
    ).toBe("/perfil");
  });

  it("devuelve etiquetas legibles en español para cada categoría", () => {
    expect(etiquetaCategoriaNotificacion("nuevo_match")).toBe("Match");
    expect(etiquetaCategoriaNotificacion("mensaje")).toBe("Mensaje");
    expect(etiquetaCategoriaNotificacion("acuerdo")).toBe("Acuerdo");
    expect(etiquetaCategoriaNotificacion("verificacion")).toBe("Verificación");
  });
});
