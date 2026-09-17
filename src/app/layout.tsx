import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getUsuarioActual } from "@/lib/session";
import { cerrarSesion } from "@/lib/auth-actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión Municipal",
  description: "Reclamos, expedientes, turnos y atención al vecino en un solo lugar.",
};

const modulos = [
  { href: "/reclamos", label: "Reclamos" },
  { href: "/expedientes", label: "Expedientes" },
  { href: "/turnos", label: "Turnos" },
  { href: "/atencion", label: "Atención al vecino" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioActual();
  const nombreMostrar = usuario?.vecino
    ? `${usuario.vecino.nombre} ${usuario.vecino.apellido}`
    : usuario?.empleado
      ? `${usuario.empleado.nombre} ${usuario.empleado.apellido}`
      : usuario?.email;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
              Municipio
            </a>
            <ul className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {modulos.map((m) => (
                <li key={m.href}>
                  <a href={m.href} className="hover:text-zinc-950 dark:hover:text-zinc-50">
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>

            {usuario ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {nombreMostrar}
                </span>
                <form action={cerrarSesion}>
                  <button
                    type="submit"
                    className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm font-medium">
                <a href="/login" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Registrarme
                </a>
              </div>
            )}
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}