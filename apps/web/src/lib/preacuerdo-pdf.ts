export interface PreAcuerdoPdfDatos {
  folio: string;
  version: number;
  circuloNombre: string;
  inmuebleTitulo: string;
  inmuebleColonia: string;
  direccionPrivada: string | null;
  arrendadorNombre: string;
  fechaInicio: string;
  duracionMeses: number;
  rentaTotal: number;
  depositoTotal: number;
  serviciosEstimados: number;
  integrantes: {
    nombre: string;
    porcentaje: number;
    montoRenta: number;
    montoDeposito: number;
    montoServicios: number;
    aceptado: boolean;
  }[];
  clausulas: string[];
}

function money(val: number): string {
  return `$${Math.round(val).toLocaleString("en-US")} MXN`;
}

/**
 * Convierte texto UTF-8 (español de México) a literal PDF con codificación WinAnsi.
 */
function escaparTextoPdfWinAnsi(texto: string): string {
  let out = "";
  for (let i = 0; i < texto.length; i++) {
    const code = texto.charCodeAt(i);
    if (code === 0x28) {
      out += "\\(";
    } else if (code === 0x29) {
      out += "\\)";
    } else if (code === 0x5c) {
      out += "\\\\";
    } else if (code >= 0x20 && code <= 0x7e) {
      out += texto[i];
    } else if (code >= 0xa0 && code <= 0xff) {
      out += `\\${code.toString(8).padStart(3, "0")}`;
    } else if (code === 0x2013 || code === 0x2014) {
      out += "-";
    } else if (code === 0x2022 || code === 0x00b7) {
      out += "\\267";
    } else {
      out += " ";
    }
  }
  return out;
}

function envolverLineas(texto: string, maxChars: number): string[] {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [""];
  const lineas: string[] = [];
  let actual = palabras[0];
  for (let i = 1; i < palabras.length; i++) {
    if (`${actual} ${palabras[i]}`.length <= maxChars) {
      actual = `${actual} ${palabras[i]}`;
    } else {
      lineas.push(actual);
      actual = palabras[i];
    }
  }
  lineas.push(actual);
  return lineas;
}

/**
 * Genera un archivo PDF 1.4 estándar en cliente sin dependencias pesadas.
 */
export function generarPreAcuerdoPdfBytes(datos: PreAcuerdoPdfDatos): Uint8Array {
  const cmds: string[] = [];
  let y = 780;

  // Franja superior de marca Otoch (#D9532C -> RGB 0.851 0.325 0.173)
  cmds.push("0.851 0.325 0.173 rg");
  cmds.push("0 792 595 50 re f");

  cmds.push("BT /F2 17 Tf 1 1 1 rg 44 811 Td (OTOCH - PRE-ACUERDO DE ARRENDAMIENTO Y CONVIVENCIA) Tj ET");
  cmds.push(
    `BT /F1 9 Tf 1 0.94 0.90 rg 44 798 Td (${escaparTextoPdfWinAnsi(`Folio: ${datos.folio}  |  Versión v${datos.version}  |  Mérida, Yucatán`)}) Tj ET`
  );

  y = 764;

  const escribirTituloSeccion = (titulo: string) => {
    y -= 18;
    cmds.push("0.184 0.490 0.357 rg");
    cmds.push(
      `BT /F2 11 Tf 44 ${y} Td (${escaparTextoPdfWinAnsi(titulo)}) Tj ET`
    );
    y -= 6;
    cmds.push("0.91 0.87 0.82 RG 0.8 w 44 " + y + " m 551 " + y + " l S");
    y -= 14;
  };

  const escribirParrafo = (
    texto: string,
    negrita = false,
    tamano = 9.5,
    maxChars = 92
  ) => {
    const lineas = envolverLineas(texto, maxChars);
    cmds.push("0.122 0.102 0.090 rg");
    for (const linea of lineas) {
      if (y < 70) break;
      cmds.push(
        `BT /${negrita ? "F2" : "F1"} ${tamano} Tf 44 ${y} Td (${escaparTextoPdfWinAnsi(linea)}) Tj ET`
      );
      y -= tamano + 4;
    }
  };

  // 1. Datos del inmueble y círculo
  escribirTituloSeccion("1. DATOS DEL CÍRCULO Y DEL INMUEBLE");
  escribirParrafo(`Círculo: ${datos.circuloNombre}`, true);
  escribirParrafo(
    `Inmueble: ${datos.inmuebleTitulo} (${datos.inmuebleColonia}, Mérida, Yucatán)`
  );
  if (datos.direccionPrivada) {
    escribirParrafo(`Dirección acordada: ${datos.direccionPrivada}`);
  }
  escribirParrafo(`Arrendador titular: ${datos.arrendadorNombre}`);
  escribirParrafo(
    `Vigencia propuesta: Inicio ${datos.fechaInicio} por ${datos.duracionMeses} mes(es)`
  );

  // 2. Condiciones económicas globales
  escribirTituloSeccion("2. CONDICIONES ECONÓMICAS MENSUALES");
  escribirParrafo(
    `Renta mensual total: ${money(datos.rentaTotal)}   |   Depósito en garantía: ${money(datos.depositoTotal)}   |   Servicios estimados: ${money(datos.serviciosEstimados)}`,
    true
  );

  // 3. Desglose de aportaciones en partes iguales
  escribirTituloSeccion(
    "3. REPARTO EN PARTES IGUALES POR ESTUDIANTE INTEGRANTE"
  );

  for (const integ of datos.integrantes) {
    const estadoTxt = integ.aceptado ? "ACEPTADO" : "PENDIENTE";
    escribirParrafo(
      `• ${integ.nombre} (${integ.porcentaje.toFixed(2)}%): Renta ${money(integ.montoRenta)} | Depósito ${money(integ.montoDeposito)} | Servicios ~${money(integ.montoServicios)} [${estadoTxt}]`
    );
  }

  // 4. Cláusulas y reglas de convivencia
  escribirTituloSeccion("4. REGLAS Y CLÁUSULAS DE CONVIVENCIA ACORDADAS");
  if (datos.clausulas.length === 0) {
    escribirParrafo(
      "Las partes acuerdan mantener respeto mutuo, pago puntual y cuidado del inmueble."
    );
  } else {
    datos.clausulas.forEach((clausula, idx) => {
      escribirParrafo(`${idx + 1}. ${clausula}`);
    });
  }

  // Pie informativo y líneas de conformidad
  const yPie = Math.max(54, y - 28);
  cmds.push("0.431 0.388 0.353 rg");
  cmds.push(
    `BT /F1 8.5 Tf 44 ${yPie} Td (${escaparTextoPdfWinAnsi("Documento informativo de pre-acuerdo generado en Otoch. No realices depósitos fuera de un acuerdo firmado por todas las partes.")}) Tj ET`
  );

  const contenidoStream = cmds.join("\n");
  const encoder = new TextEncoder();

  // Construcción de objetos PDF 1.4 con tabla xref exacta
  const objetos: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
  ];

  const streamBytesLen = encoder.encode(contenidoStream).length;
  objetos.push(
    `6 0 obj\n<< /Length ${streamBytesLen} >>\nstream\n${contenidoStream}\nendstream\nendobj\n`
  );

  let pdfStr = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objetos) {
    offsets.push(encoder.encode(pdfStr).length);
    pdfStr += obj;
  }

  const xrefOffset = encoder.encode(pdfStr).length;
  pdfStr += `xref\n0 ${objetos.length + 1}\n`;
  pdfStr += "0000000000 65535 f \n";
  for (let i = 1; i <= objetos.length; i++) {
    pdfStr += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdfStr += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdfStr);
}

export function descargarPreAcuerdoPdf(datos: PreAcuerdoPdfDatos): void {
  const bytes = generarPreAcuerdoPdfBytes(datos);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Pre_acuerdo_Otoch_${datos.folio}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
