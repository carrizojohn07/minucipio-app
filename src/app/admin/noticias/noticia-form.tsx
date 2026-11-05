import Link from "next/link";
import type { Noticia } from "@prisma/client";

const campo =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#c0000a]";
const etiqueta = "block text-xs font-semibold uppercase tracking-wide text-zinc-600";

// Formulario compartido por "Nueva noticia" y "Editar noticia".
// Si recibe una noticia, los campos se rellenan con sus datos (defaultValue).
export function NoticiaForm({
  action,
  noticia,
  textoBoton,
}: {
  action: (formData: FormData) => Promise<void>;
  noticia?: Noticia;
  textoBoton: string;
}) {
  return (
    <form action={action} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {noticia && <input type="hidden" name="id" value={noticia.id} />}

      <div>
        <label htmlFor="titulo" className={etiqueta}>Título</label>
        <input id="titulo" name="titulo" required maxLength={150} defaultValue={noticia?.titulo} className={campo} />
      </div>

      <div>
        <label htmlFor="categoria" className={etiqueta}>Categoría</label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="Ej: Obras, Salud, Cultura"
          defaultValue={noticia?.categoria}
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="imagen" className={etiqueta}>Imagen (URL, opcional)</label>
        <input
          id="imagen"
          name="imagen"
          type="url"
          placeholder="https://..."
          defaultValue={noticia?.imagen ?? ""}
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="resumen" className={etiqueta}>Resumen</label>
        <textarea id="resumen" name="resumen" required rows={2} defaultValue={noticia?.resumen} className={campo} />
      </div>

      <div>
        <label htmlFor="contenido" className={etiqueta}>Contenido</label>
        <textarea id="contenido" name="contenido" required rows={10} defaultValue={noticia?.contenido} className={campo} />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="publicada" defaultChecked={noticia?.publicada ?? false} />
        Publicada (visible para todos los vecinos)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-[#c0000a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8b0007]"
        >
          {textoBoton}
        </button>
        <Link href="/admin/noticias" className="text-sm text-zinc-500 hover:text-[#c0000a]">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
