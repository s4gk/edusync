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

// Aplica el tema antes del primer paint para evitar el parpadeo (FOUC).
// Prioridad: preferencia guardada → preferencia del sistema.
const themeScript = `(function(){try{var t=localStorage.getItem('edusync-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
