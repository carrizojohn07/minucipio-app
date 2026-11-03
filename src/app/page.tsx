// ── Noticias placeholder ─────────────────────────────────────────────────────
const noticiaDestacada = {
  categoria: "Categoría",
  titulo: "Título de la noticia principal destacada",
  resumen:
    "Resumen breve de la noticia destacada. Aquí irá el texto introductorio que describe de qué trata la nota.",
  fecha: "DD/MM/AAAA",
  imagen: null, // se reemplazará con la URL real
};

const noticiasSecundarias = [
  {
    id: 1,
    categoria: "Categoría",
    titulo: "Título de noticia secundaria",
    resumen: "Breve descripción de la noticia.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 2,
    categoria: "Categoría",
    titulo: "Título de noticia secundaria",
    resumen: "Breve descripción de la noticia.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 3,
    categoria: "Categoría",
    titulo: "Título de noticia secundaria",
    resumen: "Breve descripción de la noticia.",
    fecha: "DD/MM/AAAA",
  },
];

const noticiasBrevesPlaceholder = [
  { id: 1, titulo: "Título de noticia breve", fecha: "DD/MM/AAAA" },
  { id: 2, titulo: "Título de noticia breve", fecha: "DD/MM/AAAA" },
  { id: 3, titulo: "Título de noticia breve", fecha: "DD/MM/AAAA" },
  { id: 4, titulo: "Título de noticia breve", fecha: "DD/MM/AAAA" },
];

// ── Módulos del sistema ───────────────────────────────────────────────────────
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
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl space-y-12">

        {/* ── PORTAL DE NOTICIAS ─────────────────────────────────────────── */}
        <section>
          {/* Encabezado de sección */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Noticias del Municipio
            </h2>
            <a
              href="/noticias"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Ver todas →
            </a>
          </div>

          {/* Grid principal de noticias */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Noticia destacada (ocupa 2 columnas) */}
            <div className="lg:col-span-2 flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
              {/* Imagen placeholder */}
              <div className="h-56 w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  Imagen de la noticia
                </span>
              </div>
              {/* Contenido */}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {noticiaDestacada.categoria}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {noticiaDestacada.titulo}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  {noticiaDestacada.resumen}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {noticiaDestacada.fecha}
                  </span>
                  <a
                    href="#"
                    className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    Leer más →
                  </a>
                </div>
              </div>
            </div>

            {/* Columna derecha: noticias secundarias */}
            <div className="flex flex-col gap-4">
              {noticiasSecundarias.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {n.categoria}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                    {n.titulo}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {n.resumen}
                  </p>
                  <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
                    {n.fecha}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Noticias breves / ticker */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Últimas noticias
              </span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {noticiasBrevesPlaceholder.map((n) => (
                <li key={n.id} className="flex items-center justify-between px-4 py-2.5">
                  <a
                    href="#"
                    className="text-sm text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    {n.titulo}
                  </a>
                  <span className="ml-4 shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                    {n.fecha}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── MÓDULOS DEL SISTEMA ────────────────────────────────────────── */}
        <section>
          <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Sistema de Gestión Municipal
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Una sola plataforma para reclamos, expedientes, turnos y atención al vecino.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modulos.map((m) => (
              <a
                key={m.href}
                href={m.href}
                className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{m.titulo}</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.descripcion}</p>
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
