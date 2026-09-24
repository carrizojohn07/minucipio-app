"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";

export async function crearAtencion(formData: FormData) {
  const usuario = await requireUsuario();

  if (!usuario.vecino) {
    throw new Error("Solo un vecino registrado puede cargar una atención.");
  }

  const motivo = formData.get("motivo") as string;
  const descripcion = (formData.get("descripcion") as string)?.trim() || null;

  if (!motivo) {
    throw new Error("El motivo es obligatorio.");
  }

  await prisma.atencion.create({
    data: {
      motivo: motivo.trim(),
      descripcion,
      vecinoId: usuario.vecino.id,
    },
  });

  revalidatePath("/atencion");
}

export async function marcarAtencionResuelta(formData: FormData) {
  const usuario = await requireUsuario();

  if (usuario.rol !== "EMPLEADO" && usuario.rol !== "ADMIN") {
    throw new Error("No tenés permiso para resolver atenciones.");
  }

  const atencionId = formData.get("atencionId") as string;
  const respuesta = (formData.get("respuesta") as string)?.trim() || null;

  if (!atencionId) {
    throw new Error("Falta el id de la atención.");
  }

  await prisma.atencion.update({
    where: { id: atencionId },
    data: {
      atendida: true,
      respuesta,
    },
  });

  revalidatePath("/atencion");
}