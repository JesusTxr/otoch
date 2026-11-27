# Kit de diseño de Otoch

Esta carpeta hace que cualquier persona o IA (Claude Code, Antigravity, Cursor…) implemente la interfaz **igual al prototipo de Figma**, sin depender del conector de Figma ni de sus límites de uso.

```
design/
├── README.md            ← este archivo
├── DESIGN.md            ← especificación completa (rutas, componentes, pantallas, flujo, datos)
├── tokens/
│   ├── tokens.css       ← colores, tipografía, radios y sombras para Tailwind v4 + shadcn/ui
│   └── tokens.json      ← los mismos valores en JSON (referencia)
└── screens/
    ├── web/             ← W01…W07 en PNG (1440×900, exportadas a 2x)
    └── movil/           ← 01…08 en PNG (390×844, exportadas a 2x)
CLAUDE.md                ← instrucciones para Claude Code (en la raíz del repo)
AGENTS.md                ← mismas instrucciones para Antigravity y otros agentes
.agent/rules/otoch-design.md ← regla de workspace para Antigravity
```

## Cómo usarlo
1. Copia `design/`, `CLAUDE.md`, `AGENTS.md` y `.agent/` a la **raíz del repositorio** del proyecto y haz commit.
2. En `app/globals.css`:
   ```css
   @import "tailwindcss";
   @import "../design/tokens/tokens.css";
   ```
3. En `app/layout.tsx`:
   ```tsx
   import { Plus_Jakarta_Sans } from "next/font/google";
   const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700","800"], variable: "--font-jakarta" });
   // <html lang="es-MX" className={jakarta.variable}>
   ```
4. Pídele al agente, por ejemplo: *"Implementa la pantalla W02 · Explorar siguiendo design/DESIGN.md y compárala con design/screens/web/W02-explorar.png"*.

## Si cambian el diseño en Figma
Actualicen primero Figma, vuelvan a exportar la captura afectada y ajusten `DESIGN.md` / `tokens.css`. El repositorio es la fuente de verdad para el código.

## Figma (opcional)
Archivo: https://www.figma.com/design/W9Vf4PnvdQwmUa3UcATnQ5 (pedir acceso "can view" a Angel).
Quien use Claude Code con plan Education o asiento Full/Dev de Figma puede conectar además el servidor oficial:
`claude mcp add --transport http figma https://mcp.figma.com/mcp`
