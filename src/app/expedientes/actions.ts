"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EstadoExpediente } from "@prisma/client";

async function getUsuarioSesion() {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get("sesion_usuario_id")?.value;

  if (!usuarioId) return null;

  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { vecino: true, empleado: true },
  });
}

/**
 * Genera el siguiente número de expediente con formato EXP-YYYY-XXXXXX
 */
async function generarProximoNumeroExpediente(): Promise<string> {
  const anio = new Date().getFullYear();
  const total = await prisma.expediente.count();
  let siguienteNumero = total + 1;

  while (true) {
    const pad = String(siguienteNumero).padStart(6, "0");
    const candidato = `EXP-${anio}-${pad}`;
    const existe = await prisma.expediente.findUnique({
      where: { numero: candidato },
      select: { id: true },
    });
    if (!existe) {
      return candidato;
    }
    siguienteNumero++;
  }
}

/**
 * Crear un nuevo expediente administrativo
 */
export async function crearExpediente(formData: FormData) {
  const usuario = await getUsuarioSesion();

  if (!usuario) {
    throw new Error("Debes iniciar sesión para registrar un expediente.");
  }

  const esPersonalMunicipal = usuario.rol === "ADMIN" || usuario.rol === "EMPLEADO";
  const esVecino = usuario.rol === "VECINO" && usuario.vecino;

  if (!esPersonalMunicipal && !esVecino) {
    throw new Error("No tienes permisos suficientes para iniciar expedientes.");
  }

  const caratula = (formData.get("caratula") as string)?.trim();
  const extracto = (formData.get("extracto") as string)?.trim();
  const tipo = (formData.get("tipo") as string)?.trim();
  const areaId = (formData.get("areaId") as string)?.trim();
  const primerDictamen = (formData.get("primerDictamen") as string)?.trim();

  if (!caratula || !extracto || !tipo || !areaId) {
    throw new Error("Por favor completá los campos obligatorios (carátula, extracto, tipo y área).");
  }

  let numero = (formData.get("numero") as string)?.trim();
  let esPrivado = false;
  let titularId: string | null = null;

  if (esPersonalMunicipal) {
    esPrivado = formData.get("esPrivado") === "on";
    const vecinoIdInput = (formData.get("vecinoId") as string)?.trim();
    titularId = vecinoIdInput && vecinoIdInput !== "ninguno" ? vecinoIdInput : null;

    if (!numero) {
      numero = await generarProximoNumeroExpediente();
    } else {
      // Verificar si el número manual ya existe
      const yaExiste = await prisma.expediente.findUnique({
        where: { numero },
      });
      if (yaExiste) {
        throw new Error(`El número de expediente ${numero} ya está registrado.`);
      }
    }
  } else if (esVecino) {
    // Si lo crea el vecino, el titular es él mismo y se le autogenera el número oficial
    numero = await generarProximoNumeroExpediente();
    titularId = usuario.vecino!.id;
    esPrivado = false;
  }

  const nuevoExpediente = await prisma.expediente.create({
    data: {
      numero: numero!,
      caratula,
      extracto,
      tipo,
      areaId,
      vecinoId: titularId,
      esPrivado,
      estado: EstadoExpediente.INICIADO,
      movimientos: {
        create: {
          estadoNuevo: EstadoExpediente.INICIADO,
          comentario:
            primerDictamen ||
            (esVecino
              ? "Inicio de trámite registrado por el vecino titular desde la plataforma digital."
              : "Apertura e iniciación de actuaciones en mesa de entradas municipal."),
          esConfidencial: esPrivado,
        },
      },
    },
  });

  revalidatePath("/expedientes");
  redirect(`/expedientes?numero=${encodeURIComponent(nuevoExpediente.numero)}`);
}

/**
 * Agregar pase, dictamen u observación interna a un expediente (solo ADMIN o EMPLEADO)
 */
export async function agregarMovimiento(formData: FormData) {
  const usuario = await getUsuarioSesion();

  if (!usuario || (usuario.rol !== "ADMIN" && usuario.rol !== "EMPLEADO")) {
    throw new Error("Solo el personal municipal autorizado puede registrar dictámenes o pases.");
  }

  const expedienteId = (formData.get("expedienteId") as string)?.trim();
  const estadoNuevo = formData.get("estadoNuevo") as EstadoExpediente;
  const comentario = (formData.get("comentario") as string)?.trim();
  const esConfidencial = formData.get("esConfidencial") === "on";
  const nuevaAreaId = (formData.get("nuevaAreaId") as string)?.trim();

  if (!expedienteId || !estadoNuevo || !comentario) {
    throw new Error("Debes indicar el nuevo estado y el dictamen u observación correspondiente.");
  }

  const expedienteActual = await prisma.expediente.findUnique({
    where: { id: expedienteId },
  });

  if (!expedienteActual) {
    throw new Error("No se encontró el expediente especificado.");
  }

  const cerrar = estadoNuevo === EstadoExpediente.CERRADO;

  // Actualizar el expediente con el nuevo estado y área (si fue transferido)
  await prisma.expediente.update({
    where: { id: expedienteId },
    data: {
      estado: estadoNuevo,
      ...(nuevaAreaId && nuevaAreaId !== expedienteActual.areaId ? { areaId: nuevaAreaId } : {}),
      fechaCierre: cerrar ? (expedienteActual.fechaCierre ?? new Date()) : null,
    },
  });

  // Crear el movimiento / dictamen
  await prisma.movimientoExpediente.create({
    data: {
      expedienteId,
      estadoNuevo,
      comentario,
      esConfidencial,
    },
  });

  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${expedienteId}`);
  revalidatePath(`/expedientes/${expedienteActual.numero}`);
}

/**
 * Permite al vecino titular aportar un descargo o información adicional si su trámite está en curso
 */
export async function agregarObservacionVecino(formData: FormData) {
  const usuario = await getUsuarioSesion();

  if (!usuario?.vecino) {
    throw new Error("Debes tener una cuenta de vecino activa.");
  }

  const expedienteId = (formData.get("expedienteId") as string)?.trim();
  const comentario = (formData.get("comentario") as string)?.trim();

  if (!expedienteId || !comentario) {
    throw new Error("El comentario o descargo es obligatorio.");
  }

  const expediente = await prisma.expediente.findUnique({
    where: { id: expedienteId },
  });

  if (!expediente || expediente.vecinoId !== usuario.vecino.id) {
    throw new Error("No tienes permisos sobre este expediente.");
  }

  if (expediente.estado === EstadoExpediente.CERRADO) {
    throw new Error("El expediente se encuentra cerrado y no admite nuevas presentaciones.");
  }

  // Si estaba OBSERVADO, al presentar descargo pasa a EN_TRAMITE
  const nuevoEstado =
    expediente.estado === EstadoExpediente.OBSERVADO
      ? EstadoExpediente.EN_TRAMITE
      : expediente.estado;

  if (nuevoEstado !== expediente.estado) {
    await prisma.expediente.update({
      where: { id: expedienteId },
      data: { estado: nuevoEstado },
    });
  }

  await prisma.movimientoExpediente.create({
    data: {
      expedienteId,
      estadoNuevo: nuevoEstado,
      comentario: `Presentación del titular: ${comentario}`,
      esConfidencial: false,
    },
  });

  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${expedienteId}`);
  revalidatePath(`/expedientes/${expediente.numero}`);
}

/**
 * Eliminar expediente (solo ADMIN)
 */
export async function eliminarExpediente(formData: FormData) {
  const usuario = await getUsuarioSesion();

  if (!usuario || usuario.rol !== "ADMIN") {
    throw new Error("Acción restringida exclusivamente para administradores.");
  }

  const expedienteId = (formData.get("expedienteId") as string)?.trim();

  if (!expedienteId) return;

  await prisma.expediente.delete({
    where: { id: expedienteId },
  });

  revalidatePath("/expedientes");
}
