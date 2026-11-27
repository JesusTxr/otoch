import { describe, expect, it } from "vitest";
import { calcularCompatibilidadRoomies } from "./compatibilidad";
import {
  calcularDistanciaKm,
  formatearPuntoPostGIS,
  parsearPuntoPostGIS,
} from "./geo";
import type { PreferenciasConvivencia } from "@/types/database";

describe("PostGIS y compatibilidad Otoch", () => {
  it("parsea EWKT/WKT y calcula distancias reales en Mérida", () => {
    const ewkt = formatearPuntoPostGIS(-89.616494, 20.938419);
    const utm = parsearPuntoPostGIS(ewkt);
    expect(utm.lat).toBeCloseTo(20.938419, 4);
    expect(utm.lng).toBeCloseTo(-89.616494, 4);

    const garciaGineres = { lat: 20.9852, lng: -89.6368 };
    const km = calcularDistanciaKm(garciaGineres, utm);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(8);
  });

  it("replica el 100% de compatibilidad cuando los hábitos coinciden", () => {
    const base: PreferenciasConvivencia = {
      perfil_id: "00000000-0000-0000-0000-000000000001",
      horario_sueno: "temprano",
      limpieza: 5,
      tolerancia_ruido: 2,
      frecuencia_visitas: 2,
      estudia_en_casa: 4,
      fuma: false,
      tiene_mascota: false,
      acepta_mascotas: true,
      preferencia_roomie: "indistinto",
      intereses: ["Cocina en casa"],
      actualizado_en: "2026-11-27T00:00:00Z",
    };

    const res = calcularCompatibilidadRoomies(base, base, 2500, 2500);
    expect(res.total).toBe(100);
    expect(res.limpieza).toBe(100);
    expect(res.presupuesto).toBe(100);
  });
});
