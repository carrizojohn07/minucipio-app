import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
