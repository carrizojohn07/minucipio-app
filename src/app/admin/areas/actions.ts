"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function volver(tipo: "error" | "ok", mensaje: string): never {
  redirect(`/admin/areas?${tipo}=${encodeURIComponent(mensaje)}`);
}

// P2002 es el código de Prisma para "violación de unicidad" (nombre repetido).
function esNombreDuplicado(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function refrescar() {
  revalidatePath("/admin/areas");
  // las áreas se usan en varios formularios (turnos, reclamos, expedientes, empleados)
  revalidatePath("/turnos");
  revalidatePath("/reclamos");
  revalidatePath("/expedientes");
  revalidatePath("/admin/empleados");
}

export async function crearArea(formData: FormData) {
  await requireAdmin();

  const nombre = ((formData.get("nombre") as string) ?? "").trim();
  const descripcion = ((formData.get("descripcion") as string) ?? "").trim() || null;

  if (!nombre) volver("error", "El nombre del área es obligatorio.");

  try {
    await prisma.area.create({ data: { nombre, descripcion } });
  } catch (e) {
    if (esNombreDuplicado(e)) volver("error", `Ya existe un área llamada "${nombre}".`);
    throw e;
  }

  refrescar();
  volver("ok", `Área "${nombre}" creada.`);
}

export async function actualizarArea(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const nombre = ((formData.get("nombre") as string) ?? "").trim();
  const descripcion = ((formData.get("descripcion") as string) ?? "").trim() || null;

  if (!nombre) volver("error", "El nombre del área es obligatorio.");

  try {
    await prisma.area.update({ where: { id }, data: { nombre, descripcion } });
  } catch (e) {
    if (esNombreDuplicado(e)) volver("error", `Ya existe otra área llamada "${nombre}".`);
    // P2025: el registro a actualizar no existe (alguien lo borró mientras tanto)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      volver("error", "El área ya no existe.");
    }
    throw e;
  }

  refrescar();
  volver("ok", "Área actualizada.");
}

export async function eliminarArea(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  const area = await prisma.area.findUnique({
    where: { id },
    include: { _count: { select: { empleados: true, reclamos: true, expedientes: true, turnos: true } } },
  });

  if (!area) volver("error", "El área ya no existe.");

  // Se controla acá en el servidor, aunque la pantalla ya oculte el botón:
  // si el área tiene registros asociados, borrarla dejaría esos registros huérfanos.
  const enUso = Object.values(area._count).reduce((suma, n) => suma + n, 0);
  if (enUso > 0) {
    volver("error", `No se puede eliminar "${area.nombre}": tiene ${enUso} registro(s) asociado(s).`);
  }

  await prisma.area.delete({ where: { id } });

  refrescar();
  volver("ok", `Área "${area.nombre}" eliminada.`);
}
