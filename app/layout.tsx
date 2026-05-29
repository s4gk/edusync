import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edusync — Inicia sesión",
  description: "Plataforma de gestión escolar. Inicia sesión con tu correo institucional.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO">
      <body className={`${inter.variable} font-sans text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
