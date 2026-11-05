import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BotonConfirmar } from "../boton-confirmar";
import { ascenderAEmpleado, quitarRolEmpleado } from "./actions";

export const dynamic = "force-dynamic";

const campo =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-[#c0000a]";

export default async function AdminEmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { q, error, ok } = await searchParams;
  const busqueda = q?.trim();

  const [personal, vecinos, areas] = await Promise.all([
    prisma.empleado.findMany({
      include: { usuario: { include: { vecino: true } }, area: true },
      orderBy: { apellido: "asc" },
    }),
    // Vecinos que todavía no son personal municipal, con búsqueda opcional.
    prisma.vecino.findMany({
      where: {
        usuario: { rol: "VECINO", empleado: null },
        ...(busqueda
          ? {
              OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { apellido: { contains: busqueda, mode: "insensitive" } },
                { dni: { contains: busqueda } },
                { usuario: { email: { contains: busqueda, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { usuario: true },
      orderBy: { apellido: "asc" },
      take: 20,
    }),
    prisma.area.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-[#c0000a]">
        Volver al panel
      </Link>

      <div className="mt-3 border-b-2 border-[#c0000a] pb-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Empleados</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Convertí vecinos en personal municipal o quitales el rol.
        </p>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>}

      {/* ---------- Personal actual ---------- */}
      <h2 className="mt-8 text-lg font-semibold text-zinc-900">Personal municipal ({personal.length})</h2>

      <ul className="mt-3 space-y-3">
        {personal.map((e) => {
          const esAdmin = e.usuario.rol === "ADMIN";
          const sinFichaVecino = !e.usuario.vecino;

          return (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-zinc-900">
                  {e.nombre} {e.apellido}
                  <span
                    className={`ml-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      esAdmin
                        ? "border-red-300 bg-red-50 text-red-800"
                        : "border-blue-300 bg-blue-50 text-blue-800"
                    }`}
                  >
                    {esAdmin ? "Administrador" : "Empleado"}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  {e.usuario.email} · {e.area.nombre}
                  {e.cargo ? ` · ${e.cargo}` : ""}
                </p>
              </div>

              {esAdmin ? (
                <span className="text-xs text-zinc-400">No se puede modificar</span>
              ) : sinFichaVecino ? (
                <span className="max-w-[16rem] text-right text-xs text-zinc-400">
                  Cuenta creada solo como empleado: no tiene ficha de vecino a la que volver
                </span>
              ) : (
                <form action={quitarRolEmpleado}>
                  <input type="hidden" name="empleadoId" value={e.id} />
                  <BotonConfirmar
                    mensaje={`¿Quitarle el rol de empleado a ${e.nombre} ${e.apellido}? Volverá a ser vecino.`}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Quitar rol
                  </BotonConfirmar>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {/* ---------- Agregar empleado ---------- */}
      <h2 className="mt-12 text-lg font-semibold text-zinc-900">Agregar empleado</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Buscá a un vecino registrado por nombre, DNI o email y asignale un área.
      </p>

      <form method="get" className="mt-3 flex gap-2">
        <input name="q" defaultValue={busqueda} placeholder="Nombre, DNI o email" className={`${campo} w-72`} />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Buscar
        </button>
        {busqueda && (
          <Link href="/admin/empleados" className="self-center text-sm text-zinc-500 hover:text-[#c0000a]">
            Limpiar
          </Link>
        )}
      </form>

      {vecinos.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">
          {busqueda ? "No se encontraron vecinos con esa búsqueda." : "No hay vecinos disponibles."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {vecinos.map((v) => (
            <li key={v.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-zinc-900">
                {v.nombre} {v.apellido}
              </p>
              <p className="text-xs text-zinc-500">
                DNI {v.dni} · {v.usuario.email}
              </p>

              <form action={ascenderAEmpleado} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="vecinoId" value={v.id} />
                <select name="areaId" required defaultValue="" className={campo}>
                  <option value="" disabled>
                    Elegí un área
                  </option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <input name="cargo" placeholder="Cargo (opcional)" className={campo} />
                <button
                  type="submit"
                  className="rounded-md bg-[#c0000a] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#8b0007]"
                >
                  Hacer empleado
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
