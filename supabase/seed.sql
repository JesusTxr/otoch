-- Otoch v1.0.0 · Datos semilla (catálogos)
-- 1) Municipios de Yucatán: cargar los 106 municipios desde el catálogo oficial del INEGI.
--    Ejemplo con psql:  \copy municipios (id, clave_inegi, nombre, distancia_merida_km) from 'municipios_yucatan.csv' csv header
-- 2) Universidades: completar coordenadas reales del campus (longitud, latitud) antes de ejecutar.
insert into universidades (nombre, siglas, campus, dominio_correo, ubicacion) values
  ('Universidad Tecnológica Metropolitana', 'UTM', 'Mérida', '[COMPLETAR: dominio]', extensions.st_point(0, 0)::extensions.geography),
  ('Universidad Autónoma de Yucatán', 'UADY', '[COMPLETAR: campus]', '[COMPLETAR: dominio]', extensions.st_point(0, 0)::extensions.geography),
  ('Instituto Tecnológico de Mérida', 'ITM', 'Mérida', '[COMPLETAR: dominio]', extensions.st_point(0, 0)::extensions.geography);
-- [COMPLETAR] Sustituir st_point(0, 0) por st_point(<longitud>, <latitud>) de cada campus.
