import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Otoch — Vivienda universitaria y roomies en Mérida",
    short_name: "Otoch",
    description:
      "Encuentra cuartos verificados cerca de tu universidad en Mérida, Yucatán, haz match con roomies compatibles y dividan la renta en partes iguales.",
    start_url: "/explorar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF6F0",
    theme_color: "#D9532C",
    lang: "es-MX",
    categories: ["lifestyle", "education", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
