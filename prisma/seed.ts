import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de la base de datos...");

  // 1. Áreas
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

  const atencionCiudadana = await prisma.area.upsert({
    where: { nombre: "Atención Ciudadana" },
    update: {},
    create: { nombre: "Atención Ciudadana", descripcion: "Mesa de entradas, consultas generales" },
  });

  const hacienda = await prisma.area.upsert({
    where: { nombre: "Hacienda y Finanzas" },
    update: {},
    create: { nombre: "Hacienda y Finanzas", descripcion: "Tasas, rentas y compras municipales" },
  });

  // 2. Usuarios del personal municipal
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const adminUsuario = await prisma.usuario.upsert({
    where: { email: "admin@municipio.gob.ar" },
    update: {
      passwordHash: adminPasswordHash,
      rol: "ADMIN",
    },
    create: {
      email: "admin@municipio.gob.ar",
      passwordHash: adminPasswordHash,
      rol: "ADMIN",
    },
  });

  await prisma.empleado.upsert({
    where: { usuarioId: adminUsuario.id },
    update: {},
    create: {
      usuarioId: adminUsuario.id,
      nombre: "Administrador",
      apellido: "General",
      cargo: "Administrador del Sistema",
      areaId: obrasPublicas.id,
    },
  });

  const empleadoPasswordHash = await bcrypt.hash("empleado123", 10);
  const empleadoUsuario = await prisma.usuario.upsert({
    where: { email: "empleado@municipio.gob.ar" },
    update: {
      passwordHash: empleadoPasswordHash,
      rol: "EMPLEADO",
    },
    create: {
      email: "empleado@municipio.gob.ar",
      passwordHash: empleadoPasswordHash,
      rol: "EMPLEADO",
    },
  });

  await prisma.empleado.upsert({
    where: { usuarioId: empleadoUsuario.id },
    update: {},
    create: {
      usuarioId: empleadoUsuario.id,
      nombre: "María",
      apellido: "Gómez",
      cargo: "Operador de Mesa de Entradas",
      areaId: atencionCiudadana.id,
    },
  });

  // 3. Usuario Vecino de prueba
  const vecinoPasswordHash = await bcrypt.hash("vecino123", 10);
  const vecinoUsuario = await prisma.usuario.upsert({
    where: { email: "vecino@municipio.gob.ar" },
    update: {
      passwordHash: vecinoPasswordHash,
      rol: "VECINO",
    },
    create: {
      email: "vecino@municipio.gob.ar",
      passwordHash: vecinoPasswordHash,
      rol: "VECINO",
    },
  });

  const vecinoPrueba = await prisma.vecino.upsert({
    where: { dni: "35111222" },
    update: {
      usuarioId: vecinoUsuario.id,
    },
    create: {
      usuarioId: vecinoUsuario.id,
      nombre: "Carlos",
      apellido: "Benítez",
      dni: "35111222",
      telefono: "11-4455-6677",
      direccion: "Calle Falsa 123",
    },
  });

  // Buscar vecino existente dante si existe
  const vecinoDante = await prisma.vecino.findFirst({
    where: { dni: "48231204" },
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
