import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { BotonConfirmar } from "../boton-confirmar";
import { cambiarPublicacion, eliminarNoticia } from "./actions";

export const dynamic = "force-dynamic";

const botonSecundario =
  "rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-[#c0000a] hover:text-[#c0000a]";

export default async function AdminNoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  // A diferencia de /noticias, acá se traen TODAS: publicadas y borradores.
  const noticias = await prisma.noticia.findMany({ orderBy: { creadoEn: "desc" } });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-[#c0000a]">
        Volver al panel
      </Link>

      <div className="mt-3 flex items-center justify-between border-b-2 border-[#c0000a] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Noticias</h1>
          <p className="mt-1 text-sm text-zinc-500">{noticias.length} en total</p>
        </div>
        <Link
          href="/admin/noticias/nueva"
          className="rounded-md bg-[#c0000a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8b0007]"
        >
          Nueva noticia
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {noticias.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-400">Todavía no hay noticias cargadas.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {noticias.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      n.publicada
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {n.publicada ? "Publicada" : "Borrador"}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-zinc-500">{n.categoria}</span>
                </div>
                <p className="mt-1 truncate font-semibold text-zinc-900">{n.titulo}</p>
                <p className="text-xs text-zinc-400">
                  {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(n.creadoEn)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/noticias/${n.id}`} className={botonSecundario}>
                  Editar
                </Link>

                <form action={cambiarPublicacion}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="publicada" value={String(!n.publicada)} />
                  <button type="submit" className={botonSecundario}>
                    {n.publicada ? "Ocultar" : "Publicar"}
                  </button>
                </form>

                <form action={eliminarNoticia}>
                  <input type="hidden" name="id" value={n.id} />
                  <BotonConfirmar
                    mensaje={`¿Eliminar la noticia "${n.titulo}"? Esta acción no se puede deshacer.`}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Eliminar
                  </BotonConfirmar>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
