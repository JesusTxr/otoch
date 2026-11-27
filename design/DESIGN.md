# Otoch — Especificación de diseño para implementación

> Fuente: Figma **"Otoch — Prototipo web/móvil"** (páginas **Web · Escritorio** y **Móvil**).
> Este documento es la referencia que debe seguir cualquier persona o IA que implemente la interfaz.
> Si este documento y las capturas de `design/screens/` difieren, **manda este documento**; si algo no está aquí, **mandan las capturas**.

**Prioridad de implementación:** primero la **web (≥1024 px)**, luego el ajuste responsivo a **móvil (<1024 px)** como PWA. La app nativa (React Native + Expo) es fase 2.

---

## 1. Stack y convenciones

| Tema | Decisión |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui. Tokens en `design/tokens/tokens.css` (no inventar colores ni tamaños) |
| Fuente | Plus Jakarta Sans con `next/font/google` → variable CSS `--font-jakarta` (pesos 400, 500, 600, 700, 800) |
| Íconos | `lucide-react`, trazo 2 px, extremos redondeados (los íconos de Figma son de Lucide) |
| Backend | Supabase (Auth, Postgres + PostGIS, Realtime para el chat, Storage para fotos) |
| Idioma | Interfaz en español de México. Moneda `$2,450` (MXN, separador de miles con coma, sin decimales) |
| Accesibilidad | Contraste AA, foco visible (`ring` = primary), botones de ícono con `aria-label`, swipe siempre con botones equivalentes y atajos de teclado |

### Mapa de íconos (nombre en Figma → Lucide)
`home→House` · `users→Users` · `message→MessageCircle` · `user→User` · `heart→Heart` · `x→X` · `star→Star` · `pin→MapPin` · `bus→Bus` · `bed→Bed` · `bath→Bath` · `wifi→Wifi` · `shield→ShieldCheck` · `back→ChevronLeft` · `send→Send` · `plus→Plus` · `sliders→SlidersHorizontal` · `bell→Bell` · `check→Check` · `file→FileText` · `clock→Clock` · `mail→Mail` · `image→Image` · `wallet→Wallet` · `paw→PawPrint` · `moon→Moon` · `book→BookOpen`

---

## 2. Rutas (App Router) y pantallas

| Ruta | Pantalla web (Figma) | Pantalla móvil (Figma) | Auth |
|---|---|---|---|
| `/` | W01 · Inicio (landing) | 01 · Bienvenida | Pública |
| `/explorar` | W02 · Explorar inmuebles | 02 · Explorar inmuebles | Estudiante |
| `/inmuebles/[id]` | W03 · Detalle del inmueble | 03 · Detalle del inmueble | Estudiante |
| `/roomies?inmueble=[id]` | W04 · Roomies compatibles | 04 · Roomies compatibles | Estudiante |
| (modal sobre `/roomies`) | W05 · ¡Es un match! (modal) | 05 · ¡Es un match! (pantalla completa) | Estudiante |
| `/circulos` y `/circulos/[id]` | W06 · Círculos y chat (3 columnas) | 06 · Mis círculos → 07 · Chat del círculo | Miembro |
| `/perfil` | W07 · Mi perfil | 08 · Mi perfil | Usuario |

Layout autenticado: `app/(app)/layout.tsx` con **barra lateral** (≥1024 px) o **barra de pestañas inferior** (<1024 px). La landing no usa ese layout.

---

## 3. Componentes base (de la página "Componentes" en Figma)

### 3.1 Botón — `Botón` (variantes `Tipo`)
- Alto 52 px (web en barras: 44 px), padding horizontal 24, radio `btn` (14), texto estilo **Botón** (16/20, 700), gap 8 si lleva ícono.
- **Primario:** fondo `primary`, texto `text-inverse`. Hover: `primary-strong`.
- **Secundario:** fondo `surface`, borde 1.5 px `border`, texto `text`.
- **Fantasma:** fondo `primary-soft`, texto `primary-strong`.
- shadcn: `default` = Primario, `outline` = Secundario, `secondary` = Fantasma.

### 3.2 Chip de filtro — `Chip` (variantes `Estado`)
- Pill (radio 999), padding 8×14, texto **Pequeño fuerte**.
- **Normal:** fondo `surface`, borde 1 px `border`. **Activo:** fondo `text` (#1F1A17), texto blanco.
- Se usan como toggle (`aria-pressed`). Fila con scroll horizontal en móvil.

### 3.3 Insignia — `Insignia verificado`
- Pill, padding 4×10 (8 a la izquierda), fondo `verde-soft`, ícono `ShieldCheck` 14 px + texto **Etiqueta** en `verde`.
- Textos usados: "Verificado", "Arrendador verificado", "Correo institucional verificado".

### 3.4 Avatar — `Avatar`
- Círculo, fondo `primary-soft`, iniciales **Pequeño fuerte** en `primary-strong`. Tamaños usados: 30, 34, 36, 40, 44, 96, 112, 128.
- Variantes de color por persona (para distinguir en grupos): `primary-soft`, `verde-soft`, `sunken`.
- En grupos se apilan con solapamiento −8 a −10 px y borde 2 px del color del fondo. **Corrección pendiente de Figma:** en listas, el avatar pequeño no debe recortar las iniciales (usar mínimo 36 px y texto 12 px).
- Cuando exista foto (`perfiles.foto_ruta`), se muestra la foto; las iniciales son el respaldo.

### 3.5 Botón de acción (swipe) — `Botón de acción`
- Circulares, fondo `surface`, sombra `action`.
- **Descartar:** 64 px, ícono `X` 28 px en `danger`. **Súper:** 52 px, `Star` 22 px en `oro`. **Me gusta:** 64 px, `Heart` 28 px en `verde`.
- Separación 24 px. Atajos web: ← descartar, → me gusta, ↑ súper.

### 3.6 Navegación lateral web — `Navegación web` (variantes `Activo`)
- Ancho 248 px, alto completo, fondo `surface`, borde derecho 1 px `border`, padding 28/16/24.
- Logo (isotipo 36 px radio 10 fondo `primary` con `House` blanco + "otoch" **Título 1**).
- Ítems: Explorar, Roomies, Círculos (con contador pill `primary` "3"), Perfil. Ítem: padding 12×14, radio 12, gap 12, ícono 22. **Activo:** fondo `primary-soft`, ícono `primary`, texto **Cuerpo fuerte** `primary-strong`. **Inactivo:** ícono y texto `text-secondary`.
- Abajo: tarjeta "¿Tienes un cuarto en renta?" (fondo `canvas`, radio 16, botón Fantasma "Publicar inmueble") y fila de usuario (avatar 40 + nombre + "UTM · Verificado" en `verde`).
- **Todos los ítems deben tener la misma altura** (en Figma el de Círculos ya se corrigió).

### 3.7 Barra de pestañas móvil — `Barra de pestañas`
- 390×84, fondo `surface`, borde superior 1 px. 4 ítems (ícono 24 + **Etiqueta**), activo en `primary` con texto **Pequeño fuerte**. Respetar `safe-area-inset-bottom`.

### 3.8 Tarjeta de inmueble (swipe)
- Foto a sangre con radio 28 (web 500×560) / 24 (móvil 358×460), sombra `card`, degradado `gradient-photo` encima.
- Arriba-izquierda: Insignia verificado. Arriba-centro (móvil): indicador de fotos (barras 4 px; activa 24 px, resto 16 px al 50 %).
- Abajo (padding 20–24): título (**Título web** en web / **Título 1** en móvil, blanco), precio "$2,450" (**Título 1**/**Título 2**) + "/ persona · renta total $7,350" (**Cuerpo**/**Pequeño**), y fila de datos con ícono 16–18: `Bus` "18 min a UTM", `Bed` "3 recámaras", `Users` "2 buscan roomie".
- Detrás (móvil): "tarjeta siguiente" en `sunken`, 16 px más angosta y 20 px más abajo.
- Gestos: arrastrar horizontal con rotación ligera (±8°), umbral 30 % del ancho; tocar la tarjeta abre el detalle.

---

## 4. Pantallas WEB (1440×900) — implementar primero

Estructura común (excepto W01): `[Navegación web 248px] [Principal: padding 32/40, gap 24]`.
Encabezado de página: Título (**Título web**) + subtítulo con `MapPin` 16 `primary` y texto **Pequeño** `text-secondary`; a la derecha buscador pill 340×44 ("Buscar por colonia o escuela") + botones ícono circulares 44 (`SlidersHorizontal`, `Bell`) con borde.

### W01 · Inicio (landing) — `/`
- **Barra superior** (padding 20/80): logo; a la derecha enlaces **Cuerpo fuerte** `text-secondary` "Cómo funciona", "Para arrendadores", "Seguridad" y botón Secundario 150×44 "Iniciar sesión".
- **Hero** en dos columnas (gap 56, padding lateral 80):
  - Izquierda (600 px): etiqueta pill `primary-soft` con `MapPin` "Para estudiantes foráneos en Mérida, Yucatán"; titular **Display web** "Tu casa cerca de la escuela, con roomies que sí cuadran."; párrafo 18/28 `text-secondary` "Deja de perder 40 minutos en el camión. Encuentra cuartos verificados a menos de 20 minutos de tu escuela, haz match con estudiantes compatibles y dividan la renta en partes iguales."; botones Primario 300×56 "Entrar con correo institucional" + Secundario 190×56 "Soy arrendador"; fila de 3 sellos (ícono en cuadro 40 radio 12 `verde-soft`): `Mail` "Solo correos .edu.mx / Estudiantes verificados", `ShieldCheck` "Arrendadores con INE / Revisados por Otoch", `Wallet` "Renta dividida / En partes iguales".
  - Derecha (624×640): foto de fachada 520×620 radio 32, con 3 tarjetas flotantes (fondo blanco, radio 20, sombra fuerte): "¡Es un match!" con avatares AN/MR y "Mariana · 92% compatibles"; "Renta total $7,350 / $2,450 por roomie" con 3 barras de color iguales (primary, verde, oro); pill "`Bus` 18 min a la UTM".
- Interacciones: "Entrar con correo institucional" e "Iniciar sesión" → login con Supabase Auth (magic link / OTP) validando dominio contra `universidades.dominio_correo` → `/explorar`. "Soy arrendador" → registro de arrendador.

### W02 · Explorar inmuebles — `/explorar`
- Encabezado: "Explorar" · "Mérida · 12 inmuebles a ≤ 20 min de la UTM".
- Fila de chips: **Todos** (activo), "≤ $3,000 por persona", "≤ 20 min a mi escuela", "Con roomies buscando", "Amueblado", "Acepta mascotas".
- Contenido en dos columnas (gap 32):
  - **Swipe** (500 px): tarjeta de inmueble (§3.8) + botones de acción + texto **Etiqueta** "Atajos: ← descartar · → me gusta · ↑ súper".
  - **Lateral** (resto): tarjeta "Mapa de traslado" (alto 300, radio 20, fondo `sunken`): pin del inmueble (40 px, `primary`, borde blanco 3), pin de la escuela (40 px, `verde`, `BookOpen`) con etiqueta "UTM", pines de otros inmuebles (28 px, borde `primary`), ruta punteada `primary` 4 px, leyenda pill "`Bus` Ruta R-41 · 18 min a la UTM". Debajo "También cerca de tu escuela" (**Título 2**) + "Ver todos" (`primary`), y lista de tarjetas horizontales (foto 96×80 radio 12, título **Cuerpo fuerte** + insignia, precio **Pequeño**, "`Bus` 12 min a UTM" en `verde`, botón corazón 40).
- Mapa real: Mapbox GL. Distancia/tiempo: precalculado o Mapbox Directions; filtro "≤ 20 min" usa PostGIS (`inmuebles.ubicacion` vs `universidades.ubicacion`).
- Interacciones: clic en tarjeta → `/inmuebles/[id]`; ♥ → registra `swipes.decision='like'` y lleva a `/roomies?inmueble=[id]`; ✕ → `decision='dislike'` y muestra el siguiente.

### W03 · Detalle del inmueble — `/inmuebles/[id]` (página alta, 1180 px)
- Migas: `ChevronLeft` "Explorar / Casa en García Ginerés" (**Pequeño fuerte** `text-secondary`) → vuelve a `/explorar`.
- Galería (alto 380, gap 12): foto grande (flex) + columna 360 con dos fotos 184; la segunda con capa oscura 50 % y "`Image` Ver las 8 fotos".
- Dos columnas (gap 32):
  - **Información:** título **Título web**; fila `MapPin` "Calle 31 · García Ginerés, Mérida" + insignia "Arrendador verificado"; descripción **Cuerpo** `text-secondary`; "Lo que incluye" (chips de amenidad: borde, radio 12, ícono 18: Internet, Amueblado, Baño propio, Acepta mascotas, Contrato flexible 6 meses); "Traslado a tu escuela": tarjeta con filas (ícono `Bus` en cuadro 40 `verde-soft`, nombre **Cuerpo fuerte**, modo **Pequeño**, minutos **Título 2** `verde`): UTM 18 min, UADY 25 min, Centro 15 min.
  - **Tarjeta de reserva** (380, radio 24, sombra `sticky`, `position: sticky; top: 32px`): "$2,450 por persona / mes"; bloque `primary-soft` con Renta total $7,350 · Integrantes del círculo 3 · Servicios (aprox.) $350 c/u + 3 barras de color iguales; "2 estudiantes ya buscan roomie aquí" con avatares; botón Primario "Me interesa"; Secundario "Agendar visita"; separador; arrendador (avatar, "Don Jorge Góngora", "Arrendador · responde en ~1 h"); aviso `ShieldCheck` "No pagues nada antes de firmar en Otoch" en `verde`.
- Interacciones: "Me interesa" → `/roomies?inmueble=[id]`. "Agendar visita" → crea mensaje en el círculo o abre selector de fecha (fase 2).

### W04 · Roomies compatibles — `/roomies?inmueble=[id]`
- Encabezado: "Roomies" · "Para: Casa en García Ginerés · 8 perfiles compatibles"; selector pill del inmueble y botón de filtros.
- Columna swipe (680 px): **tarjeta roomie horizontal** 680×460 radio 28: izquierda 240 px con `gradient-roomie`, avatar 132 (borde blanco 5, iniciales **Display web** `primary`) y caja blanca "92% / compatible" (**Título 1** `verde`); derecha (padding 28, gap 14): "Mariana, 20" (**Título web**) + insignia, `BookOpen` "Ing. en Desarrollo de Software · UTM · 3er cuatrimestre", biografía **Cuerpo**, chips de estilo de vida (pill `sunken`, ícono 14): Madrugadora, Silencio después de 11, Mascotas OK, No fuma; al fondo bloque `primary-soft` "Presupuesto / $2,000 – $2,800 / mes" con `Wallet`. Debajo, botones de acción.
- Lateral: tarjeta "Por qué hacen match" con 5 barras (alto 8, radio 4, fondo `sunken`): Horarios 95 %, Orden y limpieza 90 %, Presupuesto 100 %, Ruido y visitas 80 % (en `oro` por ser < 85 %), Mascotas 85 %; y tarjeta "Siguientes en tu fila" (avatar, nombre, carrera, % en `verde`).
- Datos: `perfiles`, `perfiles_estudiante`, `preferencias_convivencia`; compatibilidad calculada en una función SQL y guardada en `matches.compatibilidad`.
- Interacciones: ♥ → `swipes` con `perfil_objetivo_id`; si es recíproco se crea `matches` y se abre **W05**.

### W05 · ¡Es un match! — modal
- Fondo: W04 con capa `rgba(31,26,23,0.6)`. Modal 520 px, radio 28, sombra `modal`, centrado.
- Portada 220 px fondo `primary` con 3 anillos concéntricos blancos (10–14 % opacidad), avatares 112 (AN y MR, solapados) y corazón blanco 44 al centro.
- Cuerpo (padding 28/40/32, centrado): "¡Es un match!" **Título web**; texto "Tú y Mariana quieren vivir en Casa en García Ginerés. Ya pueden platicar en su círculo junto con el arrendador."; pill `verde-soft` "`Wallet` $2,450 c/u · 92% compatibles"; botones lado a lado: Secundario "Seguir explorando" (cierra y vuelve a W04) y Primario "Abrir el círculo" (→ `/circulos/[id]`, crea `circulos` + `miembros_circulo` si no existen).
- shadcn `Dialog`; animación de entrada escala 0.96→1 + fade 200 ms; respeta `prefers-reduced-motion`.

### W06 · Círculos y chat — `/circulos/[id]` (3 columnas)
- **Lista** (340 px, fondo `surface`, borde derecho): "Círculos" **Título 1** + botón `Plus` 36 `primary`; buscador pill `sunken`; ítems (padding 12, radio 16, seleccionado en `primary-soft`): avatares apilados, título **Pequeño fuerte** truncado, hora **Etiqueta**, último mensaje **Etiqueta** truncado, contador pill `primary`, pill de estado: "Acordando contrato" (`primary-soft`/`primary-strong`), "Visita agendada" (`verde-soft`/`verde`), "Pendiente" (`sunken`/`text-secondary`).
- **Chat** (flex): encabezado blanco (título **Título 2**, "Tú, Mariana y Don Jorge (arrendador verificado)" en `verde`, botón Secundario "Ver inmueble"); conversación con separador "Hoy", mensajes del sistema centrados (**Etiqueta** `text-secondary`, p. ej. "Mariana aceptó las reglas de la casa"); burbujas: ajenas en `surface` con borde, radio 18 y esquina inferior izquierda 4, nombre del autor arriba en color (arrendador en `verde`); propias en `primary` texto blanco, esquina inferior derecha 4; hora **Etiqueta** dentro de la burbuja; ancho máximo ~410 px. Barra inferior: botón `Plus` 44 `sunken`, campo pill "Escribe al círculo…", botón `Send` 44 `primary`.
- **Panel del acuerdo** (340 px, borde izquierdo): "Acuerdo del círculo" + "3 de 4" en `primary`; barra de progreso 6 px; pasos con check (círculo 22 `verde` con `Check` blanco; pendiente con borde): Renta dividida $2,450 c/u · Depósito 1 mes, reembolsable · Reglas de la casa (3/3) · **Firmar contrato (6 meses)**; botón Primario "Revisar y firmar contrato"; "Integrantes" (avatar 36, nombre, rol; arrendador en `verde`); "Documentos" (tarjeta con `FileText` en cuadro `primary-soft`, "Contrato_borrador.pdf", "Subido por Don Jorge · 240 KB").
- Datos: `circulos`, `miembros_circulo`, `mensajes` (Supabase Realtime), `acuerdos`, `aportaciones` (renta en partes iguales: `porcentaje = 100 / integrantes`), Storage para `acuerdos.pdf_ruta`.
- Responsivo: <1024 px se divide en 06 (lista) y 07 (chat); el panel del acuerdo pasa a tarjeta fija arriba del chat.

### W07 · Mi perfil — `/perfil`
- Encabezado "Mi perfil" + botón Secundario 160×44 "Editar perfil".
- Columna izquierda (360, tarjeta radio 24): avatar 112 (iniciales 38 px), "Angel Noh" **Título 1**, carrera y escuela, insignia "Correo institucional verificado", 3 métricas en cajas `canvas` (3 Círculos · 12 Matches · 25 min Traslado máx.), biografía centrada.
- Columna derecha: tarjeta "Mi estilo de vida" (chips Activo/Normal: Nocturno, Ordenado, Sin mascotas, No fuma, Visitas fines de semana, Cocina en casa); fila con "Preferencias de búsqueda" (filas con ícono: Presupuesto $1,800 – $2,600 · Escuela UTM · Mérida · Traslado máximo 25 min · Zonas García Ginerés, Centro, Itzimná) y "Verificación" (3 checks `verde`: Correo institucional, Identificación oficial, Selfie de verificación); aviso `verde-soft` "Tus datos se tratan conforme a la LFPDPPP. Solo tus matches ven tu perfil completo."
- Datos: `perfiles`, `perfiles_estudiante`, `preferencias_convivencia`, `verificaciones`.

---

## 5. Pantallas MÓVIL (390×844) — adaptación responsiva

Común: barra de estado del sistema (no implementar, es del teléfono), contenido con padding 16, **barra de pestañas** fija abajo (84 px) en 02, 04, 06, 08.

| Pantalla | Diferencias respecto a la web |
|---|---|
| 01 · Bienvenida | Foto a sangre arriba (440 px) con degradado; logo sobre la foto; hoja inferior `canvas` con radio superior 28: titular **Display**, párrafo **Cuerpo**, botones a ancho completo ("Entrar con correo institucional", "Soy arrendador") y nota **Etiqueta** "Solo para estudiantes con correo .edu.mx verificado". |
| 02 · Explorar | Título **Título 1** + ubicación; botones filtro/notificaciones a la derecha; chips con scroll horizontal; tarjeta 358×460 con "tarjeta siguiente" detrás; botones de acción debajo. Sin mapa (se accede desde filtros). |
| 03 · Detalle | Galería 390×300 con botones circulares flotantes (regresar, favorito) y contador "1 / 8"; bloque de renta dividida con avatares; amenidades en chips; traslados; **barra inferior fija** con precio y botón "Me interesa" (la página hace scroll, la barra no). |
| 04 · Roomies | Tarjeta vertical: portada 200 px con degradado, avatar 112 y caja 92 %; info debajo; presupuesto al final. "Por qué hacen match" se ve al tocar la tarjeta (hoja inferior). |
| 05 · Match | Pantalla completa fondo `primary` con anillos; avatares 128; botones abajo: Secundario blanco "Abrir el círculo" y fantasma translúcido "Seguir explorando". |
| 06 · Mis círculos | Lista de tarjetas (radio 18, borde) + aviso `verde-soft` "Nunca deposites antes de firmar el contrato dentro de Otoch." |
| 07 · Chat | Encabezado con regresar + título + `FileText`; tarjeta "Acuerdo del círculo" fija arriba de los mensajes; barra de mensaje abajo (sin barra de pestañas). |
| 08 · Mi perfil | Identidad centrada, 3 métricas, chips de estilo de vida, lista de ajustes (Presupuesto, Escuela, Verificación de identidad, Notificaciones). |

---

## 6. Flujo de navegación (igual al prototipo de Figma)

```
/ (landing) ──Entrar/Iniciar sesión──▶ /explorar
/explorar ──clic tarjeta──▶ /inmuebles/[id] ──Me interesa──▶ /roomies?inmueble=[id]
/explorar ──♥──▶ /roomies?inmueble=[id]
/inmuebles/[id] ──← Explorar──▶ /explorar
/roomies ──♥ (match recíproco)──▶ modal ¡Es un match!
modal ──Abrir el círculo──▶ /circulos/[id]     modal ──Seguir explorando──▶ /roomies
Barra lateral / pestañas: Explorar · Roomies · Círculos · Perfil (desde cualquier pantalla autenticada)
```

---

## 7. Estados que el prototipo no muestra (implementar con el mismo estilo)

- **Cargando:** skeletons con fondo `sunken` y radios iguales a la tarjeta final.
- **Vacío:** "Ya viste todos los inmuebles cerca de tu escuela" + botón Secundario "Ampliar distancia"; "Aún no tienes círculos" + botón Primario "Explorar inmuebles".
- **Error:** texto `danger` + botón "Reintentar"; nunca mostrar errores técnicos al usuario.
- **Verificación pendiente:** banner `oro` suave "Verifica tu correo institucional para hacer match".
- **Sin conexión (PWA):** banner superior y chat en solo lectura.

## 8. Datos de ejemplo
Los textos, nombres (Angel, Mariana, Luis, Daniela, Don Jorge), precios y minutos son **datos de muestra**. En código deben venir de Supabase; úsalos solo en `seed` y en historias/pruebas.
