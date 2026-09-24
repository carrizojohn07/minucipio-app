"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoReclamo } from "@prisma/client";

export async function crearReclamo(formData: FormData) {
  const titulo = formData.get("titulo") as string;
  const categoria = formData.get("categoria") as string;
  const descripcion = formData.get("descripcion") as string;
  const direccion = (formData.get("direccion") as string) || null;
  const prioridad = Number(formData.get("prioridad")) || 1;
  const areaId = formData.get("areaId") as string;

  if (!titulo || !categoria || !descripcion || !areaId) {
    throw new Error("Por favor completa todos los campos obligatorios del reclamo.");
  }

  // Verificar si hay sesión iniciada
  const cookieStore = await cookies();
  const sesionUsuarioId = cookieStore.get("sesion_usuario_id")?.value;

  let vecinoId: string;

  if (sesionUsuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: sesionUsuarioId },
      include: { vecino: true },
    });

    if (!usuario?.vecino) {
      throw new Error("No se encontró el perfil de vecino para la sesión iniciada.");
    }

    vecinoId = usuario.vecino.id;
  } else {
    // Datos del vecino (ingresados en el formulario sin requerir login)
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = (formData.get("dni") as string)?.trim();
    const telefono = (formData.get("telefono") as string)?.trim() || null;
    const emailInput = (formData.get("email") as string)?.trim();

    if (!nombre || !apellido || !dni) {
      throw new Error("Por favor completa los datos personales obligatorios.");
    }

    // 1. Buscar o crear el vecino correspondiente al DNI ingresado
    let vecino = await prisma.vecino.findUnique({
      where: { dni },
    });

    if (!vecino) {
      const userEmail = emailInput && emailInput.length > 0
        ? emailInput
        : `vecino_${dni}@municipio.local`;

      // Buscar o crear el usuario base vinculado
      let usuario = await prisma.usuario.findUnique({
        where: { email: userEmail },
      });

      if (!usuario) {
        usuario = await prisma.usuario.create({
          data: {
            email: userEmail,
            passwordHash: "sin-login-temporal",
            rol: "VECINO",
          },
        });
      }

      vecino = await prisma.vecino.create({
        data: {
          usuarioId: usuario.id,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni,
          telefono,
          direccion,
        },
      });
    } else {
      // Si el vecino ya existia, actualizamos sus datos de contacto si fueron enviados
      vecino = await prisma.vecino.update({
        where: { id: vecino.id },
        data: {
          telefono: telefono ?? vecino.telefono,
          direccion: direccion ?? vecino.direccion,
        },
      });
    }

    vecinoId = vecino.id;
  }

  // 2. Crear el reclamo en estado PENDIENTE
  await prisma.reclamo.create({
    data: {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria: categoria.trim(),
      direccion,
      prioridad: Math.min(Math.max(prioridad, 1), 5),
      estado: EstadoReclamo.PENDIENTE,
      vecinoId,
      areaId,
    },
  });

  // Revalidar la pagina para reflejar el nuevo reclamo al instante
  revalidatePath("/reclamos");
}

export async function actualizarEstadoReclamo(formData: FormData) {
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
  const reclamoId = formData.get("reclamoId") as string;

  if (!reclamoId) return;

  await prisma.reclamo.delete({
    where: { id: reclamoId },
  });

  revalidatePath("/reclamos");
}
