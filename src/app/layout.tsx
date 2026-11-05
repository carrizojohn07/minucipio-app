import type { Metadata } from "next";
import Link from "next/link";
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
  { href: "/noticias", label: "Noticias" },
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
      <body className="min-h-full flex flex-col bg-[#f8f8f8]">
        {/* Franja superior con escudo/nombre */}
        <div className="bg-[#c0000a] text-white">
          <div className="mx-auto max-w-5xl px-6 py-2 flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide uppercase opacity-90">
              Sistema de Gestión Municipal
            </span>
          </div>
        </div>

        {/* Header principal */}
        <header className="bg-white border-b border-zinc-200 shadow-sm">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#c0000a] tracking-tight">
              Municipio
            </Link>
            <ul className="flex gap-6 text-sm font-medium text-zinc-600">
              {modulos.map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="hover:text-[#c0000a] transition-colors"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>

            {usuario ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-zinc-900">
                  {nombreMostrar}
                </span>
                <form action={cerrarSesion}>
                  <button
                    type="submit"
                    className="text-zinc-500 hover:text-[#c0000a] transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/login" className="text-zinc-600 hover:text-[#c0000a] transition-colors">
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-md bg-[#c0000a] px-3 py-1.5 text-white hover:bg-[#8b0007] transition-colors"
                >
                  Registrarme
                </Link>
              </div>
            )}
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}