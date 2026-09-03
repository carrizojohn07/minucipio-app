export default function ExpedientesPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Gestión de expedientes
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          En construcción. Acá va el listado y seguimiento de expedientes
          (modelos <code>Expediente</code> y <code>MovimientoExpediente</code>{" "}
          en <code>prisma/schema.prisma</code>).
        </p>
      </div>
    </div>
  );
}
