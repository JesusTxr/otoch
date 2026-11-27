-- Otoch v1.0.0 · Datos semilla (catálogos)
-- 1) Municipios de Yucatán: cargar los 106 municipios desde el catálogo oficial del INEGI.
--    Ejemplo con psql:  \copy municipios (id, clave_inegi, nombre, distancia_merida_km) from 'municipios_yucatan.csv' csv header
-- 2) Universidades de Mérida con coordenadas reales (longitud, latitud) y dominio institucional:
insert into universidades (nombre, siglas, campus, dominio_correo, ubicacion) values
  ('Universidad Tecnológica Metropolitana', 'UTM', 'Mérida', 'utmetropolitana.edu.mx', extensions.st_point(-89.616494, 20.938419)::extensions.geography),
  ('Universidad Autónoma de Yucatán', 'UADY', 'Mérida', 'alumnos.uady.mx', extensions.st_point(-89.623100, 20.969700)::extensions.geography),
  ('Instituto Tecnológico de Mérida', 'ITM', 'Mérida', 'merida.tecnm.mx', extensions.st_point(-89.622222, 21.012222)::extensions.geography)
on conflict (dominio_correo) do nothing;
