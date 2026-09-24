import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoExpediente, Prisma, Vecino } from "@prisma/client";
import { ExpedienteView, getEstadoExpedienteBadge } from "./expediente-view";
import { crearExpediente } from "./actions";

export const dynamic = "force-dynamic";

type ExpedienteCompleto = Prisma.ExpedienteGetPayload<{
  include: {
    area: true;
    vecino: true;
    movimientos: true;
  };
}>;

interface ExpedientesPageProps {
  searchParams: Promise<{
    numero?: string;
    q?: string;
    estado?: string;
    areaId?: string;
  }>;
}

export default async function ExpedientesPage({ searchParams }: ExpedientesPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const sesionUsuarioId = cookieStore.get("sesion_usuario_id")?.value;

  const [usuarioActual, areas] = await Promise.all([
    sesionUsuarioId
      ? prisma.usuario.findUnique({
          where: { id: sesionUsuarioId },
          include: { vecino: true, empleado: true },
        })
      : null,
    prisma.area.findMany({
      orderBy: { nombre: "asc" },
    }),
  ]);

  const esAdminOEmpleado = usuarioActual?.rol === "ADMIN" || usuarioActual?.rol === "EMPLEADO";
  const esVecino = usuarioActual?.rol === "VECINO" && !!usuarioActual.vecino;

  // Si busca un expediente específico por número o query
  const terminoBusqueda = (params.numero || params.q)?.trim();
  let expedienteBuscado: ExpedienteCompleto | null = null;
  const busquedaRealizada = Boolean(terminoBusqueda);

  if (terminoBusqueda) {
    expedienteBuscado = await prisma.expediente.findFirst({
      where: {
        OR: [
          { numero: { equals: terminoBusqueda, mode: "insensitive" } },
          { id: terminoBusqueda },
        ],
      },
      include: {
        area: true,
        vecino: true,
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
    });
  }

  // Datos para Vecino: "Mis Expedientes"
  let misExpedientes: ExpedienteCompleto[] = [];
  if (esVecino && usuarioActual?.vecino) {
    misExpedientes = await prisma.expediente.findMany({
      where: { vecinoId: usuarioActual.vecino.id },
      include: {
        area: true,
        vecino: true,
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
      orderBy: { fechaInicio: "desc" },
    });
  }

  // Datos para Admin / Empleado: Todos los expedientes y lista de vecinos para asignar
  let todosExpedientes: ExpedienteCompleto[] = [];
  let listaVecinos: Vecino[] = [];
  let stats = { total: 0, iniciados: 0, enTramite: 0, observados: 0, cerrados: 0 };

  if (esAdminOEmpleado) {
    const estadoFiltro = params.estado as EstadoExpediente | undefined;
    const areaFiltro = params.areaId;

    const [exps, vecinos] = await Promise.all([
      prisma.expediente.findMany({
        where: {
          ...(estadoFiltro ? { estado: estadoFiltro } : {}),
          ...(areaFiltro ? { areaId: areaFiltro } : {}),
        },
        include: {
          area: true,
          vecino: true,
          movimientos: {
            orderBy: { fecha: "desc" },
          },
        },
        orderBy: { fechaInicio: "desc" },
      }),
      prisma.vecino.findMany({
        orderBy: { apellido: "asc" },
      }),
    ]);

    todosExpedientes = exps;
    listaVecinos = vecinos;

    const todosSinFiltro = await prisma.expediente.findMany({
      select: { estado: true },
    });

    stats = {
      total: todosSinFiltro.length,
      iniciados: todosSinFiltro.filter((e) => e.estado === EstadoExpediente.INICIADO).length,
      enTramite: todosSinFiltro.filter((e) => e.estado === EstadoExpediente.EN_TRAMITE).length,
      observados: todosSinFiltro.filter((e) => e.estado === EstadoExpediente.OBSERVADO).length,
      cerrados: todosSinFiltro.filter((e) => e.estado === EstadoExpediente.CERRADO).length,
    };
  }

  // Sugerencias de muestra para facilitar pruebas rápidas
  const expedientesEjemplo = [
    { num: "EXP-2026-000101", desc: "Habilitación comercial (Titular: Carlos Benítez)" },
    { num: "EXP-2026-000102", desc: "Conexión cloacal observada (Titular: Dante)" },
    { num: "EXP-2026-000103", desc: "Transporte escolar concluido (Público)" },
    { num: "EXP-2026-000104", desc: "Auditoría reservada (Confidencial)" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {/* Cabecera Principal */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Gestión y Seguimiento de Expedientes
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Consulta pública ciudadana, control de actuaciones, dictámenes técnicos y resoluciones municipales.
          </p>
        </div>

        {/* Badge de Estado de Sesión */}
        <div>
          {usuarioActual ? (
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-300">
                Sesión:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {usuarioActual.vecino
                    ? `${usuarioActual.vecino.nombre} ${usuarioActual.vecino.apellido} (Vecino)`
                    : usuarioActual.empleado
                      ? `${usuarioActual.empleado.nombre} (${usuarioActual.rol})`
                      : usuarioActual.email}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/70 px-3.5 py-1.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <span>👤 Visitante anónimo / No registrado</span>
              <span className="text-zinc-400">|</span>
              <Link href="/login" className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-200">
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* METRICAS (Exclusivo Admin / Empleado) */}
      {esAdminOEmpleado && (
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Expedientes</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 shadow-xs dark:border-sky-900/40 dark:bg-sky-950/20">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">Iniciados</p>
            <p className="mt-1 text-2xl font-bold text-sky-900 dark:text-sky-200">{stats.iniciados}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">En Trámite</p>
            <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-200">{stats.enTramite}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Observados</p>
            <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">{stats.observados}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Cerrados</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-200">{stats.cerrados}</p>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: BUSCADOR DE EXPEDIENTE (DISPONIBLE PARA TODOS LOS ROLES Y ANÓNIMOS) */}
      <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            🔍 Consulta de Expediente por Número
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ingresá el número oficial asignado a tu trámite administrativo para conocer su estado de inmediato.
          </p>
        </div>

        <form method="GET" action="/expedientes" className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="numero"
            defaultValue={terminoBusqueda || ""}
            placeholder="Ejemplo: EXP-2026-000101"
            required
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Consultar Expediente
          </button>
          {busquedaRealizada && (
            <Link
              href="/expedientes"
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Chips de prueba rápida */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Expedientes de prueba:</span>
          {expedientesEjemplo.map((ej) => (
            <Link
              key={ej.num}
              href={`/expedientes?numero=${ej.num}`}
              title={ej.desc}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
            >
              {ej.num}
            </Link>
          ))}
        </div>
      </div>

      {/* RESULTADO DE LA BÚSQUEDA */}
      {busquedaRealizada && (
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Resultado de la Consulta
            </h3>
            <span className="text-xs text-zinc-500">Búsqueda: &ldquo;{terminoBusqueda}&rdquo;</span>
          </div>

          {expedienteBuscado ? (
            <ExpedienteView
              expediente={expedienteBuscado}
              usuario={usuarioActual}
              areas={areas}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <span className="text-3xl">⚠️</span>
              <h4 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                No se encontró ningún expediente con el número &ldquo;{terminoBusqueda}&rdquo;
              </h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Verificá que el número esté bien escrito (ej: EXP-2026-000101).
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: VECINO AUTENTICADO -> MIS EXPEDIENTES Y NUEVO TRÁMITE */}
      {esVecino && (
        <div className="mb-12 space-y-10">
          {/* Listado de Mis Expedientes */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  📁 Mis Expedientes ({misExpedientes.length})
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Expedientes en los que figuras como titular. Tenés acceso irrestricto al historial completo y dictámenes.
                </p>
              </div>
            </div>

            {misExpedientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  No tenés ningún expediente registrado a tu nombre actualmente.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Podés iniciar una solicitud administrativa utilizando el formulario de abajo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {misExpedientes.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {exp.numero}
                        </span>
                        {getEstadoExpedienteBadge(exp.estado)}
                      </div>

                      <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {exp.caratula}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                        {exp.extracto}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>🏛️ {exp.area.nombre}</span>
                        <span>·</span>
                        <span>Tipo: {exp.tipo}</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <Link
                        href={`/expedientes?numero=${exp.numero}`}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-100 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Ver Dictámenes e Historial Completo →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario de Iniciar Nuevo Expediente (Vecino) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                ✍️ Iniciar Nuevo Trámite / Expediente Municipal
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Genera un expediente formal con número oficial a tu nombre para su tratamiento en el municipio.
              </p>
            </div>

            <form action={crearExpediente} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Carátula / Título del Trámite *
                </label>
                <input
                  type="text"
                  name="caratula"
                  required
                  placeholder="Ej: Solicitud de Permiso de Obra Menor"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tipo de Trámite *
                  </label>
                  <select
                    name="tipo"
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Habilitación comercial">Habilitación comercial</option>
                    <option value="Obras particulares">Obras particulares</option>
                    <option value="Reclamo administrativo">Reclamo administrativo</option>
                    <option value="Eximición de tasas">Eximición impositiva / Tasas</option>
                    <option value="Transporte y Tránsito">Transporte y Tránsito</option>
                    <option value="Varios / Solicitud general">Varios / Solicitud general</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Área de Destino *
                  </label>
                  <select
                    name="areaId"
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Extracto / Resumen del Trámite *
                </label>
                <textarea
                  name="extracto"
                  required
                  rows={3}
                  placeholder="Detalla de forma precisa el objeto de tu presentación..."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Ingresar Trámite Oficial
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: PERSONAL MUNICIPAL (ADMIN / EMPLEADO) */}
      {esAdminOEmpleado && (
        <div className="space-y-10">
          {/* Formulario de Carga de Expediente Oficial */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    ➕ Apertura de Nuevo Expediente Administrativo
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Registrar una nueva actuación municipal, asignar área competente, vecino titular y carácter reservado.
                  </p>
                </div>
                <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Mesa de Entradas / Operador
                </span>
              </div>
            </div>

            <form action={crearExpediente} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Carátula / Título del Expediente *
                  </label>
                  <input
                    type="text"
                    name="caratula"
                    required
                    placeholder="Ej: Concesión de Espacio Público en Costanera"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Número (opcional, vacío para autogenerar)
                  </label>
                  <input
                    type="text"
                    name="numero"
                    placeholder="EXP-2026-XXXXXX"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tipo de Actuación *
                  </label>
                  <input
                    type="text"
                    name="tipo"
                    required
                    placeholder="Ej: Licitación, Habilitación, Sumario"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Área Responsable *
                  </label>
                  <select
                    name="areaId"
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Vecino Titular
                  </label>
                  <select
                    name="vecinoId"
                    defaultValue="ninguno"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ninguno">Sin titular (Actuación interna municipal)</option>
                    {listaVecinos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.apellido}, {v.nombre} (DNI: {v.dni})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Extracto / Resumen Ejecutivo *
                </label>
                <textarea
                  name="extracto"
                  required
                  rows={2}
                  placeholder="Resumen público del objeto del expediente..."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nota o Dictamen de Apertura
                </label>
                <input
                  type="text"
                  name="primerDictamen"
                  placeholder="Ej: Ingreso de documentación original por mesa general de entradas."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="esPrivado"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
                  />
                  <span className="font-semibold text-rose-700 dark:text-rose-400">
                    Expediente Reservado / Confidencial (No visible en consulta anónima)
                  </span>
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 focus:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Generar y Aperturar Expediente
                </button>
              </div>
            </form>
          </div>

          {/* Bandeja General de Todos los Expedientes */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Bandeja General de Expedientes Municipales ({todosExpedientes.length})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Acceso irrestricto a todos los expedientes, incluidos reservados e historial de dictámenes.
                </p>
              </div>

              {/* Filtros rápidos por estado */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <Link
                  href="/expedientes"
                  className={`rounded-lg px-2.5 py-1 font-medium ${
                    !params.estado
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  Todos
                </Link>
                <Link
                  href="/expedientes?estado=INICIADO"
                  className={`rounded-lg px-2.5 py-1 font-medium ${
                    params.estado === "INICIADO"
                      ? "bg-sky-600 text-white"
                      : "bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300"
                  }`}
                >
                  Iniciados
                </Link>
                <Link
                  href="/expedientes?estado=EN_TRAMITE"
                  className={`rounded-lg px-2.5 py-1 font-medium ${
                    params.estado === "EN_TRAMITE"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                  }`}
                >
                  En Trámite
                </Link>
                <Link
                  href="/expedientes?estado=OBSERVADO"
                  className={`rounded-lg px-2.5 py-1 font-medium ${
                    params.estado === "OBSERVADO"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  Observados
                </Link>
                <Link
                  href="/expedientes?estado=CERRADO"
                  className={`rounded-lg px-2.5 py-1 font-medium ${
                    params.estado === "CERRADO"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  Cerrados
                </Link>
              </div>
            </div>

            {todosExpedientes.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No hay expedientes que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {todosExpedientes.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {exp.numero}
                          </span>
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {exp.tipo}
                          </span>
                          {exp.esPrivado && (
                            <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              🔒 Reservado
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {exp.caratula}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {getEstadoExpedienteBadge(exp.estado)}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                      {exp.extracto}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                      <div>
                        <span>
                          Área: <strong className="text-zinc-800 dark:text-zinc-200">{exp.area.nombre}</strong>
                        </span>
                        <span className="mx-2">·</span>
                        <span>
                          Titular:{" "}
                          <strong className="text-zinc-800 dark:text-zinc-200">
                            {exp.vecino ? `${exp.vecino.nombre} ${exp.vecino.apellido} (DNI ${exp.vecino.dni})` : "Sin titular"}
                          </strong>
                        </span>
                      </div>
                      <div>
                        <span>
                          Iniciado:{" "}
                          {new Date(exp.fechaInicio).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <Link
                        href={`/expedientes?numero=${exp.numero}`}
                        className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Ver Actuaciones y Gestionar Dictámenes →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: INFORMACIÓN PÚBLICA PARA USUARIOS ANÓNIMOS */}
      {!usuarioActual && !busquedaRealizada && (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Consulta Abierta y Gratuita
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Cualquier vecino puede verificar en tiempo real el estado actual y el área en la que se encuentra alojado cualquier expediente público.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl mb-2">🔐</div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Privacidad y Seguridad
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Los dictámenes técnicos, pases de despacho y observaciones internas son confidenciales y solo pueden ser consultados por su titular.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-2xl mb-2">🏛️</div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Gestión Integral Municipal
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Los operadores y directores de área gestionan las derivaciones y dictámenes en un historial inmutable y transparente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
