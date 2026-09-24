import { prisma } from "@/lib/prisma";
import { EstadoReclamo } from "@prisma/client";
import { requireUsuario } from "@/lib/session";
import { crearReclamo, actualizarEstadoReclamo, eliminarReclamo } from "./actions";

export const dynamic = "force-dynamic";

const getEstadoBadge = (estado: EstadoReclamo) => {
  switch (estado) {
    case EstadoReclamo.PENDIENTE:
      return (
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Pendiente
        </span>
      );
    case EstadoReclamo.EN_PROCESO:
      return (
        <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          En Proceso
        </span>
      );
    case EstadoReclamo.RESUELTO:
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Resuelto
        </span>
      );
    case EstadoReclamo.RECHAZADO:
      return (
        <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          Rechazado
        </span>
      );
  }
};

export default async function ReclamosPage() {
  const usuario = await requireUsuario();
  const esPersonalMunicipal = usuario.rol === "EMPLEADO" || usuario.rol === "ADMIN";

  // ---------- Vista empleado/admin: todos los reclamos + panel de gestión ----------
  if (esPersonalMunicipal) {
    const reclamos = await prisma.reclamo.findMany({
      include: { vecino: true, area: true },
      orderBy: { creadoEn: "desc" },
    });

    const stats = {
      total: reclamos.length,
      pendientes: reclamos.filter((r) => r.estado === EstadoReclamo.PENDIENTE).length,
      enProceso: reclamos.filter((r) => r.estado === EstadoReclamo.EN_PROCESO).length,
      resueltos: reclamos.filter((r) => r.estado === EstadoReclamo.RESUELTO).length,
    };

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reclamos Vecinales — Panel municipal
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Seguimiento y gestión de reclamos ciudadanos para las distintas áreas del municipio.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Reclamos</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-200">{stats.pendientes}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">En Proceso</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-200">{stats.enProceso}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Resueltos</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{stats.resueltos}</p>
          </div>
        </div>

        {reclamos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Aún no hay reclamos cargados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reclamos.map((reclamo) => (
              <div
                key={reclamo.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {reclamo.categoria}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Área: <strong className="text-zinc-800 dark:text-zinc-200">{reclamo.area.nombre}</strong>
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {reclamo.titulo}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Prioridad {reclamo.prioridad}/5
                    </span>
                    {getEstadoBadge(reclamo.estado)}
                  </div>
                </div>

                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {reclamo.descripcion}
                </p>

                {reclamo.direccion && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <strong>Ubicación:</strong> {reclamo.direccion}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  <span>
                    Vecino: <strong className="text-zinc-900 dark:text-zinc-200">{reclamo.vecino.nombre} {reclamo.vecino.apellido}</strong> (DNI: {reclamo.vecino.dni})
                    {reclamo.vecino.telefono && <span className="ml-2">· Tel: {reclamo.vecino.telefono}</span>}
                  </span>
                  <span>
                    {new Date(reclamo.creadoEn).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                  <form action={actualizarEstadoReclamo} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="reclamoId" value={reclamo.id} />
                    <label className="text-zinc-500 dark:text-zinc-400">Cambiar estado:</label>
                    <select
                      name="estado"
                      defaultValue={reclamo.estado}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value={EstadoReclamo.PENDIENTE}>Pendiente</option>
                      <option value={EstadoReclamo.EN_PROCESO}>En Proceso</option>
                      <option value={EstadoReclamo.RESUELTO}>Resuelto</option>
                      <option value={EstadoReclamo.RECHAZADO}>Rechazado</option>
                    </select>
                    <input
                      type="text"
                      name="respuesta"
                      defaultValue={reclamo.respuesta ?? ""}
                      placeholder="Nota o resolución municipal..."
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 placeholder-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                    <button
                      type="submit"
                      className="rounded bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Actualizar
                    </button>
                  </form>

                  <form action={eliminarReclamo}>
                    <input type="hidden" name="reclamoId" value={reclamo.id} />
                    <button
                      type="submit"
                      className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Eliminar reclamo"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- Vista vecino: solo sus reclamos + formulario de carga ----------
  if (!usuario.vecino) {
    return (
      <div className="flex flex-1 flex-col items-center px-6 py-16">
        <p className="text-zinc-600 dark:text-zinc-400">
          Esta sección es solo para vecinos registrados.
        </p>
      </div>
    );
  }

  const [reclamos, areas] = await Promise.all([
    prisma.reclamo.findMany({
      where: { vecinoId: usuario.vecino.id },
      include: { area: true },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.area.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reclamos ciudadanos
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Registrá un reclamo y seguí su estado hasta que se resuelva.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Nuevo Reclamo
            </h2>

            <form action={crearReclamo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Título del Reclamo *
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  placeholder="Ej: Luminaria rota en la esquina"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Alumbrado Público">Alumbrado Público</option>
                    <option value="Bacheo y Pavimento">Bacheo y Pavimento</option>
                    <option value="Recolección de Residuos">Recolección de Residuos</option>
                    <option value="Espacios Verdes y Plazas">Espacios Verdes y Plazas</option>
                    <option value="Tránsito y Señalética">Tránsito y Señalética</option>
                    <option value="Agua y Cloacas">Agua y Cloacas</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Área Responsable *
                  </label>
                  <select
                    name="areaId"
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Dirección del Hecho
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    placeholder="Av. San Martín 1500"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Prioridad (1-5)
                  </label>
                  <select
                    name="prioridad"
                    defaultValue="2"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="1">1 - Baja</option>
                    <option value="2">2 - Normal</option>
                    <option value="3">3 - Media</option>
                    <option value="4">4 - Alta</option>
                    <option value="5">5 - Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Descripción del Problema *
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={3}
                  placeholder="Detalla lo que sucede para que el área correspondiente pueda intervenir..."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Cargar Reclamo
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Mis reclamos ({reclamos.length})
          </h2>

          {reclamos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Todavía no cargaste ningún reclamo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reclamos.map((reclamo) => (
                <div
                  key={reclamo.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {reclamo.categoria}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Área: <strong className="text-zinc-800 dark:text-zinc-200">{reclamo.area.nombre}</strong>
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {reclamo.titulo}
                      </h3>
                    </div>
                    {getEstadoBadge(reclamo.estado)}
                  </div>

                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                    {reclamo.descripcion}
                  </p>

                  {reclamo.respuesta && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Respuesta del Municipio:
                      </p>
                      <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
                        {reclamo.respuesta}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}