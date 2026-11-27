import { describe, expect, it } from "vitest";
import { generarPreAcuerdoPdfBytes } from "./preacuerdo-pdf";

describe("generarPreAcuerdoPdfBytes", () => {
  it("genera un binario PDF 1.4 válido con datos del círculo, integrantes y cláusulas", () => {
    const bytes = generarPreAcuerdoPdfBytes({
      folio: "CIRC0001",
      version: 1,
      circuloNombre: "Casa en García Ginerés",
      inmuebleTitulo: "Casa colonial 3 recámaras",
      inmuebleColonia: "García Ginerés",
      direccionPrivada: "Calle 31 #204",
      arrendadorNombre: "Don Jorge Góngora",
      fechaInicio: "2026-12-01",
      duracionMeses: 6,
      rentaTotal: 7350,
      depositoTotal: 7350,
      serviciosEstimados: 1050,
      integrantes: [
        {
          nombre: "Angel Noh",
          porcentaje: 50,
          montoRenta: 3675,
          montoDeposito: 3675,
          montoServicios: 525,
          aceptado: true,
        },
        {
          nombre: "Mariana",
          porcentaje: 50,
          montoRenta: 3675,
          montoDeposito: 3675,
          montoServicios: 525,
          aceptado: false,
        },
      ],
      clausulas: ["Silencio después de las 11:00 pm entre semana."],
    });

    const texto = new TextDecoder().decode(bytes);
    expect(texto.startsWith("%PDF-1.4\n")).toBe(true);
    expect(texto.endsWith("%%EOF")).toBe(true);
    expect(texto).toContain("CIRC0001");
    expect(texto).toContain("$7,350 MXN");
    expect(texto).toContain("Angel Noh");
  });
});
