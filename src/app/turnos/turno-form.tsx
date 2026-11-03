"use client";

import { useState } from "react";
import { Area } from "@prisma/client";
import { solicitarTurno } from "./actions";

interface TurnoFormProps {
  areas: Area[];
  usuarioVecino: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string | null;
  } | null;
}

const serviciosPorDefecto: Record<string, string[]> = {
  "Tránsito": [
    "Renovación de Licencia de Conducir",
    "Primera Licencia de Conducir",
    "Duplicado por Extravío",
    "Certificado de Legalidad",
  ],
  "Obras Públicas": [
    "Aprobación de Planos",
    "Permiso de Rotura de Vereda / Conexión",
    "Inspección de Obra",
  ],
  "Atención Ciudadana": [
    "Mesa de Entradas y Consultas Generales",
    "Trámites de Tarifa Social",
    "Asesoramiento Vecinal",
  ],
  "Hacienda y Finanzas": [
    "Plan de Pago de Tasas Municipales",
    "Libre Deuda Inmobiliario / Automotor",
    "Consulta de Facturación y Rentas",
  ],
};

const horariosDisponibles = [
  "08:00", "08:30", "09:00", "09:30", "10:00",
  "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
];

export function TurnoForm({ areas, usuarioVecino }: TurnoFormProps) {
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>(areas[0]?.id || "");
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>("");
  const [servicioManual, setServicioManual] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const areaActualObj = areas.find((a) => a.id === areaSeleccionada);
  const serviciosSugeridos = areaActualObj ? serviciosPorDefecto[areaActualObj.nombre] || [] : [];

  const hoyStr = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg("");
    setMensajeExito(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const servicioFinal = servicioManual.trim() || servicioSeleccionado;
    formData.set("servicio", servicioFinal);

    try {
      await solicitarTurno(formData);
      setMensajeExito(true);
      setServicioManual("");
      setServicioSeleccionado("");
      form.reset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Ocurrió un error inesperado al solicitar el turno.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Reservar Nuevo Turno
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Elegí la dependencia, el trámite y el horario que mejor te convenga.
      </p>

      {mensajeExito && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          ¡Turno reservado exitosamente! Podés verificar los datos en el listado.
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Área Municipal
          </label>
          <select
            name="areaId"
            required
            value={areaSeleccionada}
            onChange={(e) => {
              setAreaSeleccionada(e.target.value);
              setServicioSeleccionado("");
            }}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Trámite o Servicio
          </label>
          {serviciosSugeridos.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {serviciosSugeridos.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    setServicioSeleccionado(s);
                    setServicioManual("");
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                    servicioSeleccionado === s && !servicioManual
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="O escribí el motivo/servicio..."
            value={servicioManual || (!serviciosSugeridos.includes(servicioSeleccionado) ? servicioSeleccionado : "")}
            onChange={(e) => {
              setServicioManual(e.target.value);
              setServicioSeleccionado(e.target.value);
            }}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
            required={!servicioSeleccionado}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              min={hoyStr}
              required
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Horario
            </label>
            <select
              name="hora"
              required
              defaultValue="09:00"
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
            >
              {horariosDisponibles.map((h) => (
                <option key={h} value={h}>
                  {h} hs
                </option>
              ))}
            </select>
          </div>
        </div>

        {usuarioVecino ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
            Titular: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{usuarioVecino.nombre} {usuarioVecino.apellido}</span> (DNI: {usuarioVecino.dni})
          </div>
        ) : (
          <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Datos personales del solicitante
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="nombre"
                required
                placeholder="Nombre"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                name="apellido"
                required
                placeholder="Apellido"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="dni"
                required
                placeholder="DNI (sin puntos)"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email de contacto (opcional)"
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {enviando ? "Confirmando reserva..." : "Confirmar Turno"}
        </button>
      </form>
    </div>
  );
}
