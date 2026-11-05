import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { actualizarNoticia } from "../actions";
import { NoticiaForm } from "../noticia-form";

export const dynamic = "force-dynamic";

export default async function EditarNoticiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const noticia = await prisma.noticia.findUnique({ where: { id } });
  if (!noticia) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Editar noticia</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <NoticiaForm action={actualizarNoticia} noticia={noticia} textoBoton="Guardar cambios" />
    </div>
  );
}
