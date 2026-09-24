import { requireUsuario } from "@/lib/session";

export default async function AtencionPage() {
  const usuario = await requireUsuario();

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Atención al vecino
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Hola, {usuario.vecino?.nombre ?? usuario.email}. En construcción.
        </p>
      </div>
    </div>
  );
}