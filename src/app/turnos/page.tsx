import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoTurno } from "@prisma/client";
import { TurnoForm } from "./turno-form";
import { actualizarEstadoTurno, cancelarTurno } from "./actions";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const cookieStore = await cookies();
  const sesionUsuarioId = cookieStore.get("sesion_usuario_id")?.value;

  const [turnos, areas, empleados, usuarioActual] = await Promise.all([
    prisma.turno.findMany({
      include: {
        vecino: true,
        area: true,
        empleado: true,
      },
      orderBy: { fechaHora: "desc" },
    }),
    prisma.area.findMany({
      orderBy: { nombre: "asc" },
    }),
    prisma.empleado.findMany({
      orderBy: { apellido: "asc" },
    }),
    sesionUsuarioId
      ? prisma.usuario.findUnique({
          where: { id: sesionUsuarioId },
          include: { vecino: true, empleado: true },
        })
      : null,
  ]);

  const esPersonalMunicipal = usuarioActual?.rol === "ADMIN" || usuarioActual?.rol === "EMPLEADO";
  const vecinoActualId = usuarioActual?.vecino?.id;

  const stats = {
    total: turnos.length,
    reservados: turnos.filter((t) => t.estado === EstadoTurno.RESERVADO).length,
    confirmados: turnos.filter((t) => t.estado === EstadoTurno.CONFIRMADO).length,
    atendidos: turnos.filter((t) => t.estado === EstadoTurno.ATENDIDO).length,
    cancelados: turnos.filter((t) => t.estado === EstadoTurno.CANCELADO).length,
  };

  const formatearFechaHora = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getEstadoBadge = (estado: EstadoTurno) => {
    switch (estado) {
      case EstadoTurno.RESERVADO:
        return (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Reservado
          </span>
        );
      case EstadoTurno.CONFIRMADO:
        return (
          <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            Confirmado
          </span>
        );
      case EstadoTurno.ATENDIDO:
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Atendido
          </span>
        );
      case EstadoTurno.CANCELADO:
        return (
          <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gestión de Turnos
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Reserva online de turnos y administración de atención presencial en dependencias municipales.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Turnos</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Reservados</p>
          <p className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-200">{stats.reservados}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Confirmados</p>
          <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-200">{stats.confirmados}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Atendidos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{stats.atendidos}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Cancelados</p>
          <p className="mt-1 text-2xl font-semibold text-rose-900 dark:text-rose-200">{stats.cancelados}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <TurnoForm
            areas={areas}
            usuarioVecino={
              usuarioActual?.vecino
                ? {
                    nombre: usuarioActual.vecino.nombre,
                    apellido: usuarioActual.vecino.apellido,
                    dni: usuarioActual.vecino.dni,
                    telefono: usuarioActual.vecino.telefono,
                  }
                : null
            }
          />
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {esPersonalMunicipal ? "Agenda de Turnos Municipal" : "Turnos Solicitados"}
            </h2>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {turnos.length} turno(s) en total
            </span>
          </div>

          {turnos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No hay turnos registrados por el momento.
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Completá el formulario a la izquierda para agendar el primer turno.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {turnos.map((t) => {
                const esDueno = vecinoActualId && t.vecinoId === vecinoActualId;
                const puedeModificar = esPersonalMunicipal || esDueno;

                return (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {t.area.nombre}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        {getEstadoBadge(t.estado)}
                      </div>

                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {t.servicio}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatearFechaHora(new Date(t.fechaHora))}</span>
                        </div>
                        <div>
                          {t.vecino.nombre} {t.vecino.apellido} (DNI: {t.vecino.dni})
                        </div>
                        {t.empleado && (
                          <div>
                            Atiende: {t.empleado.nombre} {t.empleado.apellido}
                          </div>
                        )}
                      </div>
                    </div>

                    {puedeModificar && t.estado !== EstadoTurno.CANCELADO && t.estado !== EstadoTurno.ATENDIDO && (
                      <div className="flex flex-wrap items-center gap-2 sm:self-center">
                        {esPersonalMunicipal && t.estado === EstadoTurno.RESERVADO && (
                          <form action={actualizarEstadoTurno}>
                            <input type="hidden" name="turnoId" value={t.id} />
                            <input type="hidden" name="nuevoEstado" value={EstadoTurno.CONFIRMADO} />
                            {usuarioActual?.empleado && (
                              <input type="hidden" name="empleadoId" value={usuarioActual.empleado.id} />
                            )}
                            <button
                              type="submit"
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-500"
                            >
                              Confirmar
                            </button>
                          </form>
                        )}

                        {esPersonalMunicipal && t.estado === EstadoTurno.CONFIRMADO && (
                          <form action={actualizarEstadoTurno}>
                            <input type="hidden" name="turnoId" value={t.id} />
                            <input type="hidden" name="nuevoEstado" value={EstadoTurno.ATENDIDO} />
                            {usuarioActual?.empleado && (
                              <input type="hidden" name="empleadoId" value={usuarioActual.empleado.id} />
                            )}
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500"
                            >
                              Marcar Atendido
                            </button>
                          </form>
                        )}

                        <form action={cancelarTurno}>
                          <input type="hidden" name="turnoId" value={t.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:border-zinc-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            Cancelar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
