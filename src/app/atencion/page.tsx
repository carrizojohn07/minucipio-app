import { requireUsuario } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { crearAtencion, marcarAtencionResuelta } from "./actions";

export const dynamic = "force-dynamic";

export default async function AtencionPage() {
  const usuario = await requireUsuario();
  const esPersonalMunicipal = usuario.rol === "EMPLEADO" || usuario.rol === "ADMIN";

  // Vista del empleado/admin: ve TODAS las atenciones de todos los vecinos
  if (esPersonalMunicipal) {
    const atenciones = await prisma.atencion.findMany({
      include: { vecino: true },
      orderBy: { fecha: "desc" },
    });

    return (
      <div className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Atención al vecino — Panel municipal
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Consultas registradas por los vecinos, pendientes o resueltas.
          </p>

          {atenciones.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
              Todavía no hay atenciones cargadas.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {atenciones.map((a) => (
                <li key={a.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{a.motivo}</span>
                    {a.atendida ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Atendida
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Vecino: {a.vecino.nombre} {a.vecino.apellido} (DNI: {a.vecino.dni}) ·{" "}
                    {a.fecha.toLocaleDateString("es-AR")}
                  </p>

                  {a.descripcion && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{a.descripcion}</p>
                  )}

                  {a.atendida ? (
                    a.respuesta && (
                      <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                        Respuesta: {a.respuesta}
                      </p>
                    )
                  ) : (
                    <form action={marcarAtencionResuelta} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="atencionId" value={a.id} />
                      <input
                        type="text"
                        name="respuesta"
                        placeholder="Nota de resolución (opcional)"
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <button
                        type="submit"
                        className="rounded bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Marcar como atendida
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Vista del vecino: solo sus propias atenciones + formulario de carga
  if (!usuario.vecino) {
    return (
      <div className="flex flex-1 flex-col items-center px-6 py-16">
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta sección es solo para vecinos registrados.
        </p>
      </div>
    );
  }

  const atenciones = await prisma.atencion.findMany({
    where: { vecinoId: usuario.vecino.id },
    orderBy: { fecha: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Atención al vecino
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Registrá una consulta general y consultá el historial de tus atenciones anteriores.
        </p>

        <form action={crearAtencion} className="mt-6 flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <label htmlFor="motivo" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Motivo
            </label>
            <input
              id="motivo"
              name="motivo"
              type="text"
              required
              placeholder="Ej: Consulta sobre horarios de atención"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Registrar atención
          </button>
        </form>

        <h2 className="mt-10 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Tus atenciones anteriores
        </h2>

        {atenciones.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Todavía no registraste ninguna atención.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {atenciones.map((a) => (
              <li key={a.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{a.motivo}</span>
                  {a.atendida ? (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Atendida
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Pendiente
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {a.fecha.toLocaleDateString("es-AR")}
                </p>
                {a.descripcion && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{a.descripcion}</p>
                )}
                {a.respuesta && (
                  <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                    Respuesta del municipio: {a.respuesta}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}