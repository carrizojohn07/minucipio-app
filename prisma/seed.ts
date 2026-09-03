import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const obrasPublicas = await prisma.area.upsert({
    where: { nombre: "Obras Públicas" },
    update: {},
    create: { nombre: "Obras Públicas", descripcion: "Bacheo, alumbrado, espacios públicos" },
  });

  const transito = await prisma.area.upsert({
    where: { nombre: "Tránsito" },
    update: {},
    create: { nombre: "Tránsito", descripcion: "Licencias de conducir, señalización" },
  });

  await prisma.area.upsert({
    where: { nombre: "Atención Ciudadana" },
    update: {},
    create: { nombre: "Atención Ciudadana", descripcion: "Mesa de entradas, consultas generales" },
  });

  const adminUsuario = await prisma.usuario.upsert({
    where: { email: "admin@municipio.gob.ar" },
    update: {},
    create: {
      email: "admin@municipio.gob.ar",
      passwordHash: "changeme", // placeholder: reemplazar por hash real cuando se implemente login
      rol: "ADMIN",
    },
  });

  await prisma.empleado.upsert({
    where: { usuarioId: adminUsuario.id },
    update: {},
    create: {
      usuarioId: adminUsuario.id,
      nombre: "Admin",
      apellido: "Municipal",
      cargo: "Administrador del sistema",
      areaId: obrasPublicas.id,
    },
  });

  console.log("Seed completado:", { obrasPublicas: obrasPublicas.nombre, transito: transito.nombre });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
