import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getUsuarioActual() {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get("sesion_usuario_id")?.value;

  if (!usuarioId) {
    return null;
  }

  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { vecino: true, empleado: true },
  });
}
export async function requireUsuario() {
  const usuario = await getUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
}