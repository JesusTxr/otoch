-- Otoch v1.0.0 · Datos semilla (catálogos)
-- 1) Municipios principales de Yucatán (clave INEGI y distancia aproximada a Mérida en km):
insert into municipios (id, clave_inegi, nombre, distancia_merida_km) values
  (50, '050', 'Mérida', 0.0),
  (41, '041', 'Kanasín', 8.5),
  (101, '101', 'Umán', 18.0),
  (13, '013', 'Conkal', 16.5),
  (59, '059', 'Progreso', 36.0),
  (38, '038', 'Hunucmá', 31.0),
  (2, '002', 'Acanceh', 28.0),
  (93, '093', 'Tixkokob', 27.0),
  (52, '052', 'Motul', 44.0),
  (48, '048', 'Maxcanú', 63.0),
  (33, '033', 'Halachó', 76.0),
  (53, '053', 'Muna', 63.0),
  (40, '040', 'Izamal', 72.0),
  (89, '089', 'Ticul', 85.0),
  (11, '011', 'Celestún', 95.0),
  (6, '006', 'Buctzotz', 92.0),
  (69, '069', 'Sotuta', 98.0),
  (56, '056', 'Oxkutzcab', 103.0),
  (79, '079', 'Tekax', 117.0),
  (58, '058', 'Peto', 136.0),
  (32, '032', 'Espita', 145.0),
  (102, '102', 'Valladolid', 160.0),
  (96, '096', 'Tizimín', 165.0),
  (19, '019', 'Chemax', 186.0),
  (61, '061', 'Río Lagartos', 215.0)
on conflict (id) do nothing;

-- 2) Universidades de Mérida con coordenadas reales (longitud, latitud) y dominio institucional:
insert into universidades (nombre, siglas, campus, dominio_correo, ubicacion) values
  ('Universidad Tecnológica Metropolitana', 'UTM', 'Mérida', 'utmetropolitana.edu.mx', extensions.st_point(-89.616494, 20.938419)::extensions.geography),
  ('Universidad Autónoma de Yucatán', 'UADY', 'Mérida', 'alumnos.uady.mx', extensions.st_point(-89.623100, 20.969700)::extensions.geography),
  ('Instituto Tecnológico de Mérida', 'ITM', 'Mérida', 'merida.tecnm.mx', extensions.st_point(-89.622222, 21.012222)::extensions.geography)
on conflict (dominio_correo) do nothing;
