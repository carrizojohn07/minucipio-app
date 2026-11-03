// Placeholder de noticias — se reemplazará con datos reales
const todasLasNoticias = [
  {
    id: 1,
    categoria: "Categoría",
    titulo: "Título de la noticia uno",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 2,
    categoria: "Categoría",
    titulo: "Título de la noticia dos",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 3,
    categoria: "Categoría",
    titulo: "Título de la noticia tres",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 4,
    categoria: "Categoría",
    titulo: "Título de la noticia cuatro",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 5,
    categoria: "Categoría",
    titulo: "Título de la noticia cinco",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
  {
    id: 6,
    categoria: "Categoría",
    titulo: "Título de la noticia seis",
    resumen:
      "Resumen breve de la noticia. Aquí irá el texto introductorio que describe de qué trata la nota publicada.",
    fecha: "DD/MM/AAAA",
  },
];

export default function NoticiasPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl">

        {/* Encabezado */}
        <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Noticias del Municipio
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Todas las novedades e información oficial del municipio.
          </p>
        </div>

        {/* Lista de noticias */}
        <ul className="mt-6 divide-y divide-zinc-100 dark:divide-zinc-800">
          {todasLasNoticias.map((n) => (
            <li key={n.id} className="py-5">
              <a href="#" className="group flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {n.categoria} · {n.fecha}
                </span>
                <h2 className="text-base font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
                  {n.titulo}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {n.resumen}
                </p>
              </a>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
