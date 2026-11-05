"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Vuelve a la pantalla de empleados mostrando un mensaje de error o de éxito.
// Devuelve "never" porque redirect() corta la ejecución: lo que viene después no se ejecuta.
function volver(tipo: "error" | "ok", mensaje: string): never {
  redirect(`/admin/empleados?${tipo}=${encodeURIComponent(mensaje)}`);
}

export async function ascenderAEmpleado(formData: FormData) {
  await requireAdmin();

  const vecinoId = formData.get("vecinoId") as string;
  const areaId = formData.get("areaId") as string;
  const cargo = ((formData.get("cargo") as string) ?? "").trim() || null;

  if (!vecinoId || !areaId) {
    volver("error", "Elegí un área para el nuevo empleado.");
  }

  const [vecino, area] = await Promise.all([
    prisma.vecino.findUnique({
      where: { id: vecinoId },
      include: { usuario: { include: { empleado: true } } },
    }),
    prisma.area.findUnique({ where: { id: areaId } }),
  ]);

  if (!vecino) volver("error", "El vecino seleccionado no existe.");
  if (!area) volver("error", "El área seleccionada no existe.");

  if (vecino.usuario.rol !== "VECINO" || vecino.usuario.empleado) {
    volver("error", "Esa persona ya forma parte del personal municipal.");
  }

  // Las dos escrituras van juntas: o se hacen las dos o no se hace ninguna.
  // Si no, podría quedar un usuario con rol EMPLEADO pero sin ficha de empleado.
  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: vecino.usuarioId },
      data: { rol: "EMPLEADO" },
    }),
    prisma.empleado.create({
      data: {
        usuarioId: vecino.usuarioId,
        nombre: vecino.nombre,
        apellido: vecino.apellido,
        cargo,
        areaId,
      },
    }),
  ]);

  revalidatePath("/admin/empleados");
  revalidatePath("/admin");
  volver("ok", `${vecino.nombre} ${vecino.apellido} ahora es empleado de ${area.nombre}.`);
}

export async function quitarRolEmpleado(formData: FormData) {
  const admin = await requireAdmin();

  const empleadoId = formData.get("empleadoId") as string;

  const empleado = await prisma.empleado.findUnique({
    where: { id: empleadoId },
    include: { usuario: { include: { vecino: true } } },
  });

  if (!empleado) volver("error", "El empleado ya no existe.");

  // Un admin no puede quitarse el rol a sí mismo (se quedaría sin acceso) ni tocar a otros admins.
  if (empleado.usuarioId === admin.id || empleado.usuario.rol === "ADMIN") {
    volver("error", "No se puede quitar el rol a un administrador.");
  }

  // Sin ficha de vecino, la cuenta quedaría sin ninguna ficha y las pantallas de vecino fallarían.
  if (!empleado.usuario.vecino) {
    volver("error", "Esa cuenta no tiene ficha de vecino, así que no puede volver a ser vecino.");
  }

  // Los turnos que tenía asignados quedan sin empleado (la base lo hace sola: ON DELETE SET NULL).
  await prisma.$transaction([
    prisma.empleado.delete({ where: { id: empleadoId } }),
    prisma.usuario.update({
      where: { id: empleado.usuarioId },
      data: { rol: "VECINO" },
    }),
  ]);

  revalidatePath("/admin/empleados");
  revalidatePath("/admin");
  volver("ok", `${empleado.nombre} ${empleado.apellido} volvió a ser vecino.`);
}
