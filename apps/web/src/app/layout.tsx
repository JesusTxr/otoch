import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#D9532C",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Otoch — Tu casa cerca de la escuela, con roomies que sí cuadran",
  description:
    "Encuentra cuartos verificados cerca de tu universidad en Mérida, Yucatán, haz match con roomies compatibles y dividan la renta en partes iguales.",
  applicationName: "Otoch",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Otoch",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={plusJakartaSans.variable}>
      <body className="min-h-dvh bg-canvas text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
