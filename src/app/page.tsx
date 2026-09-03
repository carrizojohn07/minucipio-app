const modulos = [
  {
    href: "/reclamos",
    titulo: "Reclamos ciudadanos",
    descripcion: "Los vecinos cargan reclamos y siguen su estado hasta que se resuelven.",
  },
  {
    href: "/expedientes",
    titulo: "Gestión de expedientes",
    descripcion: "Seguimiento de trámites administrativos, con historial de movimientos.",
  },
  {
    href: "/turnos",
    titulo: "Gestión de turnos",
    descripcion: "Reserva y administración de turnos para las distintas áreas del municipio.",
  },
  {
    href: "/atencion",
    titulo: "Atención al vecino",
    descripcion: "Registro de consultas e interacciones generales con los vecinos.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sistema de Gestión Municipal
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Una sola plataforma para reclamos, expedientes, turnos y atención al vecino.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modulos.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            >
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{m.titulo}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.descripcion}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
