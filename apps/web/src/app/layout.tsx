import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Otoch — Tu casa cerca de la escuela, con roomies que sí cuadran",
  description:
    "Encuentra cuartos verificados cerca de tu universidad en Mérida, Yucatán, haz match con roomies compatibles y dividan la renta en partes iguales.",
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
