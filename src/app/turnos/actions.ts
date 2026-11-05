"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { EstadoTurno } from "@prisma/client";
import { requireUsuario } from "@/lib/session";

export async function solicitarTurno(formData: FormData) {
  const usuario = await requireUsuario();

  if (!usuario.vecino) {
    throw new Error("Solo un vecino registrado puede solicitar un turno.");
  }

  const areaId = formData.get("areaId") as string;
  const servicio = (formData.get("servicio") as string)?.trim();
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;

  if (!areaId || !servicio || !fecha || !hora) {
    throw new Error("Por favor completá todos los campos del turno.");
  }

  const fechaHora = new Date(`${fecha}T${hora}:00`);
  if (isNaN(fechaHora.getTime())) {
    throw new Error("La fecha u hora seleccionada no es válida.");
  }

  if (fechaHora < new Date()) {
    throw new Error("No se puede reservar un turno en una fecha pasada.");
  }

  await prisma.turno.create({
    data: {
      fechaHora,
      servicio,
      estado: EstadoTurno.RESERVADO,
      areaId,
      vecinoId: usuario.vecino.id,
    },
  });

  revalidatePath("/turnos");
}

export async function actualizarEstadoTurno(formData: FormData) {
  const usuario = await requireUsuario();

  if (usuario.rol !== "EMPLEADO" && usuario.rol !== "ADMIN") {
    throw new Error("No tenés permiso para actualizar turnos.");
  }

  const turnoId = formData.get("turnoId") as string;
  const nuevoEstado = formData.get("nuevoEstado") as EstadoTurno;
  const empleadoId = (formData.get("empleadoId") as string) || null;

  if (!turnoId || !nuevoEstado) {
    throw new Error("Faltan datos obligatorios para actualizar el turno.");
  }

  await prisma.turno.update({
    where: { id: turnoId },
    data: {
      estado: nuevoEstado,
      ...(empleadoId ? { empleadoId } : {}),
    },
  });

  revalidatePath("/turnos");
}

export async function cancelarTurno(formData: FormData) {
  const usuario = await requireUsuario();

  const turnoId = formData.get("turnoId") as string;

  if (!turnoId) {
    throw new Error("ID de turno requerido.");
  }

  const turno = await prisma.turno.findUnique({ where: { id: turnoId } });

  if (!turno) {
    throw new Error("El turno no existe.");
  }

  const esPersonalMunicipal = usuario.rol === "EMPLEADO" || usuario.rol === "ADMIN";
  const esDueno = usuario.vecino?.id === turno.vecinoId;

  if (!esPersonalMunicipal && !esDueno) {
    throw new Error("No tenés permiso para cancelar este turno.");
  }

  await prisma.turno.update({
    where: { id: turnoId },
    data: {
      estado: EstadoTurno.CANCELADO,
    },
  });

  revalidatePath("/turnos");
}