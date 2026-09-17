"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function cerrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete("sesion_usuario_id");
  redirect("/");
}