"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoTurno } from "@prisma/client";

export async function solicitarTurno(formData: FormData) {
  const areaId = formData.get("areaId") as string;
  const servicio = (formData.get("servicio") as string)?.trim();
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;

  if (!areaId || !servicio || !fecha || !hora) {
    throw new Error("Por favor completa todos los campos del turno.");
  }

  const fechaHora = new Date(`${fecha}T${hora}:00`);
  if (isNaN(fechaHora.getTime())) {
    throw new Error("La fecha u hora seleccionada no es válida.");
  }

  const cookieStore = await cookies();
  const sesionUsuarioId = cookieStore.get("sesion_usuario_id")?.value;

  let vecinoId: string;

  if (sesionUsuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: sesionUsuarioId },
      include: { vecino: true },
    });

    if (!usuario?.vecino) {
      throw new Error("No se encontró el perfil de vecino vinculado a tu cuenta.");
    }

    vecinoId = usuario.vecino.id;
  } else {
    const nombre = (formData.get("nombre") as string)?.trim();
    const apellido = (formData.get("apellido") as string)?.trim();
    const dni = (formData.get("dni") as string)?.trim();
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const emailInput = (formData.get("email") as string)?.trim();

    if (!nombre || !apellido || !dni) {
      throw new Error("Por favor completa nombre, apellido y DNI.");
    }

    let vecino = await prisma.vecino.findUnique({
      where: { dni },
    });

    if (!vecino) {
      const email = emailInput && emailInput.length > 0
        ? emailInput
        : `vecino_${dni}@municipio.local`;

      let usuario = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!usuario) {
        usuario = await prisma.usuario.create({
          data: {
            email,
            passwordHash: "sin-login-temporal",
            rol: "VECINO",
          },
        });
      }

      vecino = await prisma.vecino.create({
        data: {
          usuarioId: usuario.id,
          nombre,
          apellido,
          dni,
          telefono,
        },
      });
    } else if (telefono) {
      vecino = await prisma.vecino.update({
        where: { id: vecino.id },
        data: { telefono },
      });
    }

    vecinoId = vecino.id;
  }

  await prisma.turno.create({
    data: {
      fechaHora,
      servicio,
      estado: EstadoTurno.RESERVADO,
      areaId,
      vecinoId,
    },
  });

  revalidatePath("/turnos");
}

export async function actualizarEstadoTurno(formData: FormData) {
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
  const turnoId = formData.get("turnoId") as string;

  if (!turnoId) {
    throw new Error("ID de turno requerido.");
  }

  await prisma.turno.update({
    where: { id: turnoId },
    data: {
      estado: EstadoTurno.CANCELADO,
    },
  });

  revalidatePath("/turnos");
}
