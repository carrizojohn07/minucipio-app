"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function leerCampos(formData: FormData) {
  const texto = (nombre: string) => ((formData.get(nombre) as string) ?? "").trim();

  return {
    titulo: texto("titulo"),
    resumen: texto("resumen"),
    contenido: texto("contenido"),
    categoria: texto("categoria"),
    imagen: texto("imagen") || null,
    // un checkbox tildado llega como "on"; si no está tildado, ni siquiera llega
    publicada: formData.get("publicada") === "on",
  };
}

// Devuelve el mensaje de error, o null si todo está bien.
function validar(campos: ReturnType<typeof leerCampos>): string | null {
  if (!campos.titulo || !campos.resumen || !campos.contenido || !campos.categoria) {
    return "Completá título, categoría, resumen y contenido.";
  }
  if (campos.titulo.length > 150) {
    return "El título no puede superar los 150 caracteres.";
  }
  if (campos.imagen && !/^https?:\/\//i.test(campos.imagen)) {
    return "La imagen tiene que ser una URL que empiece con http:// o https://";
  }
  return null;
}

function refrescarPaginas(id?: string) {
  revalidatePath("/");
  revalidatePath("/noticias");
  revalidatePath("/admin");
  revalidatePath("/admin/noticias");
  if (id) revalidatePath(`/noticias/${id}`);
}

export async function crearNoticia(formData: FormData) {
  await requireAdmin();

  const campos = leerCampos(formData);
  const error = validar(campos);

  if (error) {
    redirect(`/admin/noticias/nueva?error=${encodeURIComponent(error)}`);
  }

  await prisma.noticia.create({ data: campos });

  refrescarPaginas();
  redirect("/admin/noticias");
}

export async function actualizarNoticia(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const campos = leerCampos(formData);
  const error = validar(campos);

  if (error) {
    redirect(`/admin/noticias/${id}?error=${encodeURIComponent(error)}`);
  }

  const existe = await prisma.noticia.findUnique({ where: { id }, select: { id: true } });
  if (!existe) {
    redirect(`/admin/noticias?error=${encodeURIComponent("La noticia ya no existe.")}`);
  }

  await prisma.noticia.update({ where: { id }, data: campos });

  refrescarPaginas(id);
  redirect("/admin/noticias");
}

export async function cambiarPublicacion(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  // el valor al que queremos llegar viaja en el formulario, así un doble click no la "rebota"
  const publicada = formData.get("publicada") === "true";

  await prisma.noticia.updateMany({ where: { id }, data: { publicada } });

  refrescarPaginas(id);
}

export async function eliminarNoticia(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  // deleteMany no falla si la noticia ya fue borrada (por ejemplo, por otra pestaña)
  await prisma.noticia.deleteMany({ where: { id } });

  refrescarPaginas(id);
}
