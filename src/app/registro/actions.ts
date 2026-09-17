"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function registrarUsuario(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;
  const dni = formData.get("dni") as string;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      rol: "VECINO",
      vecino: {
        create: { nombre, apellido, dni },
      },
    },
  });

  redirect("/login");
}