import { prisma } from "@/lib/prisma";

export default async function NoticiasPage() {
  const noticias = await prisma.noticia.findMany({
    where: { publicada: true },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl">

        {/* Encabezado */}
        <div className="border-b-2 border-[#c0000a] pb-4">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Noticias del Municipio
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Todas las novedades e información oficial del municipio.
          </p>
        </div>

        {/* Lista de noticias */}
        {noticias.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-400">
            No hay noticias publicadas aún.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-100">
            {noticias.map((n) => {
              const fecha = new Intl.DateTimeFormat("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date(n.creadoEn));

              return (
                <li key={n.id} className="py-5">
                  <a href={`/noticias/${n.id}`} className="group flex gap-5 items-start">
                    {/* Imagen miniatura (si existe) */}
                    {n.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.imagen}
                        alt={n.titulo}
                        className="w-24 h-20 rounded-lg object-cover shrink-0 border border-zinc-200"
                      />
                    ) : (
                      <div className="w-24 h-20 rounded-lg bg-zinc-100 shrink-0 border border-zinc-200 flex items-center justify-center">
                        <span className="text-xs text-zinc-400">Sin imagen</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#c0000a]">
                        {n.categoria} · {fecha}
                      </span>
                      <h2 className="text-base font-semibold text-zinc-900 group-hover:text-[#c0000a] transition-colors leading-snug">
                        {n.titulo}
                      </h2>
                      <p className="text-sm text-zinc-500 line-clamp-2">
                        {n.resumen}
                      </p>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}

      </div>
    </div>
  );
}
