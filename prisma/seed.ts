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

  // 4. Expedientes de muestra
  // Expediente 1: De Carlos Benítez
  await prisma.expediente.upsert({
    where: { numero: "EXP-2026-000101" },
    update: {},
    create: {
      numero: "EXP-2026-000101",
      caratula: "Solicitud de Habilitación Comercial - Rubro Gastronomía",
      extracto: "Trámite de habilitación comercial para restaurante sito en Av. San Martín 450.",
      tipo: "Habilitación comercial",
      estado: "EN_TRAMITE",
      esPrivado: false,
      vecinoId: vecinoPrueba.id,
      areaId: obrasPublicas.id,
      movimientos: {
        create: [
          {
            estadoNuevo: "INICIADO",
            comentario: "Apertura de expediente y presentación de planos edilicios.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            estadoNuevo: "EN_TRAMITE",
            comentario: "Dictamen Técnico N° 45/26: Planos aprobados. Pasa a inspección de Seguridad e Higiene.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Expediente 2: De Dante (si existe, sino de Carlos)
  const exp2TitularId = vecinoDante?.id ?? vecinoPrueba.id;
  await prisma.expediente.upsert({
    where: { numero: "EXP-2026-000102" },
    update: {},
    create: {
      numero: "EXP-2026-000102",
      caratula: "Permiso de Conexión a Red Cloacal y Pavimento",
      extracto: "Solicitud de factibilidad técnica y permiso de rotura de vereda para conexión de servicio.",
      tipo: "Obras particulares",
      estado: "OBSERVADO",
      esPrivado: false,
      vecinoId: exp2TitularId,
      areaId: obrasPublicas.id,
      movimientos: {
        create: [
          {
            estadoNuevo: "INICIADO",
            comentario: "Ingreso de la solicitud formal por mesa de entradas.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
          {
            estadoNuevo: "OBSERVADO",
            comentario: "Dictamen de Inspección: Falta adjuntar póliza de seguro de caución y croquis de interferencias subterráneas. Se intima a subsanar en 10 días hábiles.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Expediente 3: Tránsito / Licencia especial
  await prisma.expediente.upsert({
    where: { numero: "EXP-2026-000103" },
    update: {},
    create: {
      numero: "EXP-2026-000103",
      caratula: "Habilitación de Vehículo para Transporte Escolar",
      extracto: "Verificación técnica vehicular y habilitación de unidad de transporte escolar para el ciclo 2026.",
      tipo: "Transporte y Tránsito",
      estado: "CERRADO",
      esPrivado: false,
      fechaCierre: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      vecinoId: vecinoPrueba.id,
      areaId: transito.id,
      movimientos: {
        create: [
          {
            estadoNuevo: "INICIADO",
            comentario: "Ingreso de documentación vehicular y seguro de pasajeros.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
          {
            estadoNuevo: "EN_TRAMITE",
            comentario: "Inspección mecánica aprobada satisfactoriamente en planta municipal.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            estadoNuevo: "CERRADO",
            comentario: "Resolución Final N° 112/26: Se otorga oblea y certificado de habilitación por 12 meses.",
            esConfidencial: false,
            fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Expediente 4: Expediente Confidencial / Privado
  await prisma.expediente.upsert({
    where: { numero: "EXP-2026-000104" },
    update: {},
    create: {
      numero: "EXP-2026-000104",
      caratula: "Auditoría Interna de Adquisiciones y Licitaciones",
      extracto: "Procedimiento de control interno reservado sobre pliegos licitatorios.",
      tipo: "Auditoría interna",
      estado: "EN_TRAMITE",
      esPrivado: true,
      areaId: hacienda.id,
      movimientos: {
        create: [
          {
            estadoNuevo: "INICIADO",
            comentario: "Apertura de procedimiento de control reservado conforme a directiva del Tribunal de Cuentas.",
            esConfidencial: true,
            fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            estadoNuevo: "EN_TRAMITE",
            comentario: "Dictamen de Asesoría Legal: Se remiten copias certificadas al área de compras para descargo preliminar.",
            esConfidencial: true,
            fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log("Seed completado exitosamente con usuarios, áreas y expedientes de prueba.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
