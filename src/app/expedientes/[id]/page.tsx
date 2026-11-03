import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/session";
import { ExpedienteView } from "../expediente-view";

export const dynamic = "force-dynamic";

interface ExpedienteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpedienteDetailPage({ params }: ExpedienteDetailPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [usuarioActual, areas, expediente] = await Promise.all([
    getUsuarioActual(),
    prisma.area.findMany({
      orderBy: { nombre: "asc" },
    }),
    prisma.expediente.findFirst({
      where: {
        OR: [
          { numero: { equals: decodedId, mode: "insensitive" } },
          { id: decodedId },
        ],
      },
      include: {
        area: true,
        vecino: true,
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
    }),
  ]);

  if (!expediente) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/expedientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Volver al buscador de expedientes
        </Link>
        <span className="font-mono text-xs text-zinc-400">{expediente.numero}</span>
      </div>

      <ExpedienteView
        expediente={expediente}
        usuario={usuarioActual}
        areas={areas}
        isDetailPage
      />
    </div>
  );
}
