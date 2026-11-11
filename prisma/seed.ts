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

  // 4. Noticias de ejemplo
  // Noticia no tiene ningún campo único aparte del id, así que no se puede usar upsert.
  // En su lugar se busca por título: si ya existe no se hace nada, y el seed se puede
  // correr todas las veces que haga falta sin duplicar noticias.
  const noticiasEjemplo = [
    {
      titulo: "Comenzó la repavimentación de las calles del centro",
      categoria: "Obras",
      resumen:
        "El municipio inició los trabajos de bacheo y repavimentación en las principales arterias del casco céntrico.",
      contenido:
        "La Secretaría de Obras Públicas dio inicio a un plan de repavimentación que abarcará las calles más transitadas del centro de la ciudad. Los trabajos se realizarán por etapas para minimizar las molestias a vecinos y comercios.\n\n" +
        "Durante las tareas habrá cortes parciales de tránsito en horario diurno. Se recomienda a los conductores circular con precaución y respetar las indicaciones del personal de señalización.\n\n" +
        "Los vecinos que detecten baches u otros desperfectos pueden informarlos a través del módulo de Reclamos de esta plataforma.",
    },
    {
      titulo: "Nueva plataforma online para reclamos, trámites y turnos",
      categoria: "Institucional",
      resumen:
        "Los vecinos ya pueden realizar reclamos, seguir expedientes y reservar turnos desde un solo lugar, sin hacer filas.",
      contenido:
        "El municipio puso en marcha el Sistema de Gestión Municipal, una plataforma web que reúne en un solo lugar los principales trámites y servicios para el vecino.\n\n" +
        "Desde su cuenta, cada persona puede cargar reclamos, consultar el estado de sus expedientes, reservar turnos de atención presencial y realizar consultas generales. Todo queda registrado y puede seguirse en línea.\n\n" +
        "Para comenzar, solo hace falta registrarse con un email y los datos personales básicos.",
    },
    {
      titulo: "Jornada de vacunación y controles de salud gratuitos",
      categoria: "Salud",
      resumen:
        "Este mes se realizarán controles médicos y vacunación en los centros de salud barriales, sin necesidad de turno previo.",
      contenido:
        "La Secretaría de Salud informa que durante este mes se llevarán adelante jornadas de vacunación y controles de salud gratuitos en los centros de atención primaria de cada barrio.\n\n" +
        "Podrán asistir niños y adultos con su DNI y libreta sanitaria, en el horario habitual de atención. Las jornadas se repetirán todas las semanas hasta fin de mes.",
    },
  ];

  for (const noticia of noticiasEjemplo) {
    const existente = await prisma.noticia.findFirst({ where: { titulo: noticia.titulo } });
    if (!existente) {
      await prisma.noticia.create({ data: { ...noticia, publicada: true } });
    }
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
