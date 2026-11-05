import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NoticiaPage({ params }: Props) {
  const { id } = await params;

  const noticia = await prisma.noticia.findUnique({
    where: { id },
  });

  if (!noticia || !noticia.publicada) notFound();

  const fechaFormateada = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(noticia.creadoEn));

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <article className="w-full max-w-3xl">

        {/* Volver */}
        <a
          href="/noticias"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#c0000a] transition-colors mb-8"
        >
          ← Volver a noticias
        </a>

        {/* Categoría */}
        <span className="text-xs font-semibold uppercase tracking-widest text-[#c0000a]">
          {noticia.categoria}
        </span>

        {/* Título */}
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 leading-tight">
          {noticia.titulo}
        </h1>

        {/* Fecha */}
        <p className="mt-3 text-sm text-zinc-400">{fechaFormateada}</p>

        {/* Línea roja separadora */}
        <div className="mt-6 border-t-2 border-[#c0000a]" />

        {/* Imagen (si existe) */}
        {noticia.imagen && (
          <div className="mt-6 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={noticia.imagen}
              alt={noticia.titulo}
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        {/* Resumen destacado */}
        <p className="mt-6 text-lg text-zinc-600 leading-relaxed font-medium border-l-4 border-[#c0000a] pl-4">
          {noticia.resumen}
        </p>

        {/* Contenido completo */}
        <div className="mt-6 prose prose-zinc max-w-none text-zinc-700 leading-relaxed whitespace-pre-line">
          {noticia.contenido}
        </div>

        {/* Footer de la nota */}
        <div className="mt-10 border-t border-zinc-200 pt-6 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Publicado el {fechaFormateada}</span>
          <a
            href="/noticias"
            className="text-sm font-medium text-[#c0000a] hover:text-[#8b0007] transition-colors"
          >
            ← Ver todas las noticias
          </a>
        </div>

      </article>
    </div>
  );
}
