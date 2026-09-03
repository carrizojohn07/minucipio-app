# Sistema de Gestión Municipal

Proyecto final — plataforma para un municipio con 4 módulos: **Reclamos ciudadanos**,
**Gestión de expedientes**, **Gestión de turnos** y **Atención al vecino**.

Stack: Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL.

## Setup para cada integrante del equipo

1. Clonar el repo e instalar dependencias:

   ```bash
   npm install
   ```

2. Tener PostgreSQL instalado y corriendo localmente (versión 17 recomendada).
   Crear una base vacía, por ejemplo `municipio_db`.

3. Copiar `.env.example` a `.env` y completar con tus propios datos de conexión:

   ```
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/municipio_db?schema=public"
   ```

4. Generar el cliente de Prisma y crear las tablas en tu base local:

   ```bash
   npx prisma migrate dev
   ```

5. (Opcional) Cargar datos de ejemplo:

   ```bash
   npx prisma db seed
   ```

6. Levantar el proyecto:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Estructura de la base de datos (`prisma/schema.prisma`)

- `Usuario` / `Vecino` / `Empleado` / `Area` — base compartida por todos los módulos
  (login, perfil de ciudadano, perfil de empleado municipal y dependencias del municipio).
- `Reclamo` — módulo **Reclamos ciudadanos**.
- `Expediente` + `MovimientoExpediente` — módulo **Gestión de expedientes** (con historial).
- `Turno` — módulo **Gestión de turnos**.
- `Atencion` — módulo **Atención al vecino** (consultas generales).

Cada módulo tiene su carpeta placeholder en `src/app/<modulo>/page.tsx` como punto de partida.

## Comandos útiles de Prisma

- `npx prisma studio` — interfaz visual para ver/editar los datos de la base.
- `npx prisma migrate dev --name <descripcion>` — crear una nueva migración después de modificar el schema.
- `npx prisma generate` — regenerar el cliente de Prisma (se corre solo con `migrate dev`, pero a veces hay que forzarlo).
