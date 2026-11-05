import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

type Conteo = { etiqueta: string; cantidad: number };

// groupBy devuelve [{ estado: "PENDIENTE", _count: { _all: 3 } }, ...]; lo pasamos a algo más simple.
function aConteos(filas: { _count: { _all: number } }[], campo: string): Conteo[] {
  return filas.map((f) => ({
    etiqueta: String((f as Record<string, unknown>)[campo]).replace("_", " ").toLowerCase(),
    cantidad: f._count._all,
  }));
}

function Tarjeta({ titulo, conteos }: { titulo: string; conteos: Conteo[] }) {
  const total = conteos.reduce((suma, c) => suma + c.cantidad, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#c0000a]">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{total}</p>
      <ul className="mt-3 space-y-1 text-sm text-zinc-600">
        {conteos.length === 0 ? (
          <li className="text-zinc-400">Sin datos todavía</li>
        ) : (
          conteos.map((c) => (
            <li key={c.etiqueta} className="flex justify-between">
              <span className="capitalize">{c.etiqueta}</span>
              <span className="font-medium text-zinc-900">{c.cantidad}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

const secciones = [
  {
    href: "/admin/noticias",
    titulo: "Noticias",
    descripcion: "Crear, editar, publicar u ocultar y eliminar las noticias del municipio.",
  },
  {
    href: "/admin/empleados",
    titulo: "Empleados",
    descripcion: "Convertir vecinos en empleados municipales y quitarles el rol.",
  },
  {
    href: "/admin/areas",
    titulo: "Áreas",
    descripcion: "Administrar las dependencias del municipio.",
  },
];

export default async function AdminPage() {
  await requireAdmin();

  const [usuarios, reclamos, expedientes, turnos, atencionesPendientes, atencionesResueltas, noticiasPublicadas, noticiasBorrador] =
    await Promise.all([
      prisma.usuario.groupBy({ by: ["rol"], _count: { _all: true } }),
      prisma.reclamo.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.expediente.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.turno.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.atencion.count({ where: { atendida: false } }),
      prisma.atencion.count({ where: { atendida: true } }),
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.noticia.count({ where: { publicada: false } }),
    ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="border-b-2 border-[#c0000a] pb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Panel de administración</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestión del sistema y resumen general de la actividad.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-[#c0000a]"
          >
            <h2 className="font-semibold text-zinc-900">{s.titulo}</h2>
            <p className="mt-1 text-sm text-zinc-600">{s.descripcion}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold text-zinc-900">Estadísticas generales</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta titulo="Usuarios por rol" conteos={aConteos(usuarios, "rol")} />
        <Tarjeta titulo="Reclamos" conteos={aConteos(reclamos, "estado")} />
        <Tarjeta titulo="Expedientes" conteos={aConteos(expedientes, "estado")} />
        <Tarjeta titulo="Turnos" conteos={aConteos(turnos, "estado")} />
        <Tarjeta
          titulo="Atención al vecino"
          conteos={[
            { etiqueta: "pendientes", cantidad: atencionesPendientes },
            { etiqueta: "atendidas", cantidad: atencionesResueltas },
          ]}
        />
        <Tarjeta
          titulo="Noticias"
          conteos={[
            { etiqueta: "publicadas", cantidad: noticiasPublicadas },
            { etiqueta: "borradores", cantidad: noticiasBorrador },
          ]}
        />
      </div>
    </div>
  );
}
