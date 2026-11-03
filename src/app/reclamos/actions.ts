"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { EstadoReclamo } from "@prisma/client";

export async function crearReclamo(formData: FormData) {
  const usuario = await requireUsuario();

  if (!usuario.vecino) {
    throw new Error("Solo un vecino registrado puede cargar un reclamo.");
  }

  const titulo = formData.get("titulo") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const direccion = (formData.get("direccion") as string)?.trim() || null;
  const prioridad = Number(formData.get("prioridad")) || 1;
  const areaId = formData.get("areaId") as string;

  if (!titulo || !categoria || !descripcion || !areaId) {
    throw new Error("Por favor completa todos los campos obligatorios del reclamo.");
  }

  await prisma.reclamo.create({
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria: categoria.trim(),
      direccion,
      prioridad: Math.min(Math.max(prioridad, 1), 5),
      estado: EstadoReclamo.PENDIENTE,
      vecinoId: usuario.vecino.id,
      areaId,
    },
  });

  revalidatePath("/reclamos");
}

export async function actualizarEstadoReclamo(formData: FormData) {
  const usuario = await requireUsuario();

  if (usuario.rol !== "EMPLEADO" && usuario.rol !== "ADMIN") {
    throw new Error("No tenés permiso para actualizar reclamos.");
  }

  const reclamoId = formData.get("reclamoId") as string;
  const estado = formData.get("estado") as EstadoReclamo;
  const respuesta = (formData.get("respuesta") as string)?.trim() || null;

  if (!reclamoId || !estado) {
    throw new Error("Datos incompletos para actualizar el reclamo.");
  }

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: {
      estado,
      ...(respuesta ? { respuesta } : {}),
    },
  });

  revalidatePath("/reclamos");
}

export async function eliminarReclamo(formData: FormData) {
  const usuario = await requireUsuario();

  if (usuario.rol !== "EMPLEADO" && usuario.rol !== "ADMIN") {
    throw new Error("No tenés permiso para eliminar reclamos.");
  }

  const reclamoId = formData.get("reclamoId") as string;

  if (!reclamoId) return;

  await prisma.reclamo.delete({
    where: { id: reclamoId },
  });

  revalidatePath("/reclamos");
}