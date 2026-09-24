import Link from "next/link";
import { Area, EstadoExpediente, Expediente, MovimientoExpediente, Usuario, Vecino, Empleado } from "@prisma/client";
import { agregarMovimiento, agregarObservacionVecino, eliminarExpediente } from "./actions";

type ExpedienteConRelaciones = Expediente & {
  area: Area;
  vecino: Vecino | null;
  movimientos: MovimientoExpediente[];
};

type UsuarioConRelaciones = (Usuario & {
  vecino: Vecino | null;
  empleado: Empleado | null;
}) | null;

interface ExpedienteViewProps {
  expediente: ExpedienteConRelaciones;
  usuario: UsuarioConRelaciones;
  areas?: Area[];
  isDetailPage?: boolean;
}

export function getEstadoExpedienteBadge(estado: EstadoExpediente) {
  switch (estado) {
    case EstadoExpediente.INICIADO:
      return (
        <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
          Iniciado
        </span>
      );
    case EstadoExpediente.EN_TRAMITE:
      return (
        <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          En Trámite
        </span>
      );
    case EstadoExpediente.OBSERVADO:
      return (
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Observado
        </span>
      );
    case EstadoExpediente.CERRADO:
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Cerrado
        </span>
      );
  }
}

export function ExpedienteView({
  expediente,
  usuario,
  areas = [],
}: ExpedienteViewProps) {
  const esAdminOEmpleado = usuario?.rol === "ADMIN" || usuario?.rol === "EMPLEADO";
  const esTitular = !!(usuario?.vecino && expediente.vecinoId && usuario.vecino.id === expediente.vecinoId);
  const tieneAccesoPrivado = esAdminOEmpleado || esTitular;

  // CASO 1: Expediente privado y usuario no autorizado (anónimo u otro vecino no titular)
  if (expediente.esPrivado && !tieneAccesoPrivado) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/50 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-2xl dark:bg-rose-950">
            🔒
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {expediente.numero}
              </span>
              <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Expediente Reservado
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Expediente Confidencial
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Este expediente tiene carácter confidencial y sus actuaciones se encuentran restringidas.
              Solo las autoridades municipales competentes o el vecino titular pueden acceder a su información.
            </p>
            {!usuario && (
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Iniciar sesión para identificarte
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: Usuario no registrado / Visitante anónimo O Vecino que NO es titular
  // "Usuario no registrado / Visitante anónimo: Ingresa el número de expediente y solo ve el estado actual, número de expediente y área donde se encuentra alojado."
  if (!tieneAccesoPrivado) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Consulta Pública
                </span>
                {usuario?.vecino && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    (No sos el titular de este expediente)
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {expediente.numero}
              </h2>
            </div>
            <div>{getEstadoExpedienteBadge(expediente.estado)}</div>
          </div>
        </div>

        {/* Solo ve estado actual, número de expediente y área donde se encuentra alojado */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Estado Actual
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {expediente.estado === "INICIADO" && "Iniciado en mesa de entradas"}
                {expediente.estado === "EN_TRAMITE" && "En trámite administrativo"}
                {expediente.estado === "OBSERVADO" && "Observado con requerimiento pendiente"}
                {expediente.estado === "CERRADO" && "Cerrado / Concluido"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Área donde se encuentra alojado
            </span>
            <p className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              🏛️ {expediente.area.nombre}
            </p>
            {expediente.area.descripcion && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {expediente.area.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Mensaje de aviso de privacidad para dictámenes y notas internas */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-semibold">
                Acceso restringido a dictámenes, observaciones internas e historial
              </p>
              <p className="mt-1 text-blue-800 dark:text-blue-300">
                Por normativa de protección de datos, los dictámenes técnicos, pases internos y observaciones
                solo pueden ser visualizados por el <strong>Vecino Titular</strong> del expediente o por personal
                con rol <strong>Administrador / Empleado</strong>.
              </p>
              {!usuario && (
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center font-semibold underline hover:text-blue-950 dark:hover:text-blue-100"
                  >
                    ¿Sos el titular de este expediente? Iniciá sesión acá →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CASO 3: Usuario AUTORIZADO (Vecino Titular O Admin/Empleado Municipal)
  // "Vecino (Titular/Dueño): Inicia sesión con su cuenta. El sistema detecta que su vecinoId coincide con el del expediente y le habilita ver los dictámenes, observaciones internas y el historial completo."
  // "Administrador / Empleado municipal: Al iniciar sesión con un usuario que tiene rol: 'ADMIN' o 'EMPLEADO', tiene libre acceso a la información privada de todos los expedientes del municipio."

  const movimientosVisibles = expediente.movimientos;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Banner de Identificación y Acceso Privado */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
          <span>🛡️</span>
          {esTitular ? (
            <span>
              Acceso Titular Verificado: Has iniciado sesión como el titular legítimo de este expediente (
              {usuario?.vecino?.nombre} {usuario?.vecino?.apellido}).
            </span>
          ) : (
            <span>
              Acceso Autorizado Municipal: Rol {usuario?.rol} (Libre acceso a la información privada y dictámenes).
            </span>
          )}
        </div>
        {expediente.esPrivado && (
          <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Expediente Reservado
          </span>
        )}
      </div>

      {/* Cabecera del Expediente */}
      <div className="border-b border-zinc-100 pb-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {expediente.numero}
              </span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Tipo: {expediente.tipo}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {expediente.caratula}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {expediente.extracto}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {getEstadoExpedienteBadge(expediente.estado)}
          </div>
        </div>
      </div>

      {/* Metadatos y Datos Clave */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Área Actual</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            🏛️ {expediente.area.nombre}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Titular del Trámite</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {expediente.vecino
              ? `${expediente.vecino.nombre} ${expediente.vecino.apellido}`
              : "Sin titular asignado (Actuación de Oficio)"}
          </p>
          {expediente.vecino && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              DNI: {expediente.vecino.dni}
              {esAdminOEmpleado && expediente.vecino.telefono && ` · Tel: ${expediente.vecino.telefono}`}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Fecha de Inicio</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {new Date(expediente.fechaInicio).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Fecha de Cierre</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {expediente.fechaCierre
              ? new Date(expediente.fechaCierre).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "En curso"}
          </p>
        </div>
      </div>

      {/* Historial Completo y Dictámenes (Habilitado para Vecino Titular y Admin/Empleado) */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Historial de Pases, Dictámenes y Observaciones Internas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Secuencia cronológica oficial del expediente administrativo ({movimientosVisibles.length} actuaciones)
            </p>
          </div>
        </div>

        {movimientosVisibles.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No hay actuaciones registradas aún.</p>
        ) : (
          <div className="relative border-l-2 border-zinc-200 pl-6 space-y-6 ml-3 dark:border-zinc-800">
            {movimientosVisibles.map((mov, idx) => (
              <div key={mov.id} className="relative group">
                {/* Dot on the timeline */}
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 dark:border-zinc-900 dark:bg-blue-500" />

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:group-hover:border-zinc-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 pb-2 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Pase #{movimientosVisibles.length - idx}
                      </span>
                      {getEstadoExpedienteBadge(mov.estadoNuevo)}
                      {mov.esConfidencial && (
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Dictamen Reservado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(mov.fecha).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Dictamen / Observación:
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                      {mov.comentario || "Sin observaciones asentadas en este pase."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCIÓN PARA EL VECINO TITULAR: Presentar descargo / respuesta */}
      {esTitular && expediente.estado !== EstadoExpediente.CERRADO && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <h4 className="text-sm font-semibold text-blue-950 dark:text-blue-200">
            Aportar Documentación o Responder Observación
          </h4>
          <p className="mt-0.5 text-xs text-blue-800 dark:text-blue-300">
            Si recibiste una observación o querés asentar una respuesta formal en tu expediente, podés escribirla acá:
          </p>
          <form action={agregarObservacionVecino} className="mt-3 space-y-3">
            <input type="hidden" name="expedienteId" value={expediente.id} />
            <textarea
              name="comentario"
              required
              rows={2}
              placeholder="Escribí tu respuesta, descargo o detalle de la documentación aportada..."
              className="w-full rounded-lg border border-blue-200 bg-white p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Enviar al Expediente
            </button>
          </form>
        </div>
      )}

      {/* ACCIONES EXCLUSIVAS PARA ADMINISTRADOR Y EMPLEADO MUNICIPAL */}
      {esAdminOEmpleado && (
        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="rounded-xl border border-zinc-300 bg-zinc-100/60 p-5 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Panel Operativo: Registrar Nuevo Pase o Dictamen Municipal
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Actualiza el estado, asienta el dictamen técnico y deriva a otra área si corresponde.
                </p>
              </div>
              <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                Personal Municipal ({usuario?.rol})
              </span>
            </div>

            <form action={agregarMovimiento} className="mt-4 space-y-4">
              <input type="hidden" name="expedienteId" value={expediente.id} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nuevo Estado *
                  </label>
                  <select
                    name="estadoNuevo"
                    defaultValue={expediente.estado}
                    required
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value={EstadoExpediente.INICIADO}>Iniciado</option>
                    <option value={EstadoExpediente.EN_TRAMITE}>En Trámite</option>
                    <option value={EstadoExpediente.OBSERVADO}>Observado (Falta documentación/requerimiento)</option>
                    <option value={EstadoExpediente.CERRADO}>Cerrado (Resolución definitiva)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Derivar a otra Área (opcional)
                  </label>
                  <select
                    name="nuevaAreaId"
                    defaultValue={expediente.areaId}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                  Dictamen / Observación / Resolución Oficial *
                </label>
                <textarea
                  name="comentario"
                  required
                  rows={3}
                  placeholder="Detalla el dictamen legal/técnico, los motivos de observación o la resolución de cierre..."
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="esConfidencial"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700"
                  />
                  <span>Marcar este pase como reservado / confidencial (solo visible internamente)</span>
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Registrar Dictamen / Pase
                </button>
              </div>
            </form>

            {usuario?.rol === "ADMIN" && (
              <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <form action={eliminarExpediente}>
                  <input type="hidden" name="expedienteId" value={expediente.id} />
                  <button
                    type="submit"
                    className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 underline"
                  >
                    Eliminar expediente definitivamente (Solo Admin)
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
