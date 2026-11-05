import { requireAdmin } from "@/lib/session";
import { crearNoticia } from "../actions";
import { NoticiaForm } from "../noticia-form";

export default async function NuevaNoticiaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Nueva noticia</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <NoticiaForm action={crearNoticia} textoBoton="Guardar noticia" />
    </div>
  );
}
