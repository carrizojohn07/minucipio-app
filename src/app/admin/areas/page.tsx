import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BotonConfirmar } from "../boton-confirmar";
import { actualizarArea, crearArea, eliminarArea } from "./actions";

export const dynamic = "force-dynamic";

const campo =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-[#c0000a]";

export default async function AdminAreasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { error, ok } = await searchParams;

  const areas = await prisma.area.findMany({
    orderBy: { nombre: "asc" },
    // _count trae cuántos registros de otras tablas apuntan a cada área
    include: { _count: { select: { empleados: true, reclamos: true, expedientes: true, turnos: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-[#c0000a]">
        Volver al panel
      </Link>

      <div className="mt-3 border-b-2 border-[#c0000a] pb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Áreas municipales</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Las áreas reciben reclamos, expedientes y turnos, y es donde trabajan los empleados.
        </p>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>}

      {/* ---------- Nueva área ---------- */}
      <form action={crearArea} className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="nuevo-nombre" className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Nueva área
          </label>
          <input id="nuevo-nombre" name="nombre" required placeholder="Nombre" className={`${campo} mt-1 w-56`} />
        </div>
        <input name="descripcion" placeholder="Descripción (opcional)" className={`${campo} w-72`} />
        <button
          type="submit"
          className="rounded-md bg-[#c0000a] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#8b0007]"
        >
          Crear área
        </button>
      </form>

      {/* ---------- Listado ---------- */}
      <ul className="mt-6 space-y-3">
        {areas.map((a) => {
          const enUso = Object.values(a._count).reduce((suma, n) => suma + n, 0);

          return (
            <li key={a.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <form action={actualizarArea} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input name="nombre" required defaultValue={a.nombre} className={`${campo} w-56`} />
                <input name="descripcion" defaultValue={a.descripcion ?? ""} placeholder="Descripción" className={`${campo} w-72`} />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-[#c0000a] hover:text-[#c0000a]"
                >
                  Guardar
                </button>
              </form>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  {a._count.empleados} empleados · {a._count.reclamos} reclamos · {a._count.expedientes} expedientes ·{" "}
                  {a._count.turnos} turnos
                </p>

                {enUso > 0 ? (
                  <span className="text-xs text-zinc-400">En uso: no se puede eliminar</span>
                ) : (
                  <form action={eliminarArea}>
                    <input type="hidden" name="id" value={a.id} />
                    <BotonConfirmar
                      mensaje={`¿Eliminar el área "${a.nombre}"?`}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      Eliminar
                    </BotonConfirmar>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
