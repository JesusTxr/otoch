import type { PreferenciasConvivencia } from "@/types/database";

export interface DesgloseCompatibilidad {
  total: number;
  horarios: number;
  limpieza: number;
  presupuesto: number;
  ruidoVisitas: number;
  mascotas: number;
}

/**
 * Replica exactamente la fórmula SQL de `compatibilidad(p_a, p_b)` en
 * `20261023000003_funciones_negocio.sql` y genera el desglose visual de W04.
 */
export function calcularCompatibilidadRoomies(
  a: PreferenciasConvivencia | null,
  b: PreferenciasConvivencia,
  presupuestoA?: number | null,
  presupuestoB?: number | null
): DesgloseCompatibilidad {
  if (!a) {
    return {
      total: 80,
      horarios: 80,
      limpieza: 80,
      presupuesto: 85,
      ruidoVisitas: 80,
      mascotas: 85,
    };
  }

  const scoreSueno = a.horario_sueno === b.horario_sueno ? 1 : 0.4;
  const scoreLimpieza = 1 - Math.abs(a.limpieza - b.limpieza) / 4.0;
  const scoreRuido =
    1 - Math.abs(a.tolerancia_ruido - b.tolerancia_ruido) / 4.0;
  const scoreVisitas =
    1 - Math.abs(a.frecuencia_visitas - b.frecuencia_visitas) / 4.0;
  const scoreEstudio =
    1 - Math.abs(a.estudia_en_casa - b.estudia_en_casa) / 4.0;
  const scoreFuma = a.fuma === b.fuma ? 1 : 0;
  const conflictoMascotas =
    (a.tiene_mascota && !b.acepta_mascotas) ||
    (b.tiene_mascota && !a.acepta_mascotas);
  const scoreMascotas = conflictoMascotas ? 0 : 1;

  const totalExacto =
    Math.round(
      100 *
        (0.2 * scoreSueno +
          0.2 * scoreLimpieza +
          0.15 * scoreRuido +
          0.1 * scoreVisitas +
          0.1 * scoreEstudio +
          0.15 * scoreFuma +
          0.1 * scoreMascotas) *
        100
    ) / 100;

  let presupuestoPct = 92;
  if (presupuestoA && presupuestoB && presupuestoA > 0 && presupuestoB > 0) {
    const diffRatio =
      Math.abs(presupuestoA - presupuestoB) /
      Math.max(presupuestoA, presupuestoB);
    presupuestoPct = Math.round(Math.max(55, (1 - diffRatio) * 100));
  }

  return {
    total: Math.round(totalExacto),
    horarios: Math.round(((scoreSueno * 0.7 + scoreEstudio * 0.3) * 100)),
    limpieza: Math.round(scoreLimpieza * 100),
    presupuesto: presupuestoPct,
    ruidoVisitas: Math.round(((scoreRuido * 0.6 + scoreVisitas * 0.4) * 100)),
    mascotas: conflictoMascotas ? 25 : a.tiene_mascota === b.tiene_mascota ? 100 : 88,
  };
}

export function calcularEdadDesdeFecha(fechaNacimiento: string): number {
  const partes = fechaNacimiento.split("-").map(Number);
  if (partes.length !== 3) return 20;
  const hoy = new Date();
  let edad = hoy.getFullYear() - partes[0];
  const m = hoy.getMonth() + 1 - partes[1];
  if (m < 0 || (m === 0 && hoy.getDate() < partes[2])) {
    edad -= 1;
  }
  return Math.max(18, edad);
}
