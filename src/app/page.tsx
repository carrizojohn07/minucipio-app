import { prisma } from "@/lib/prisma";

// ── Iconos SVG simples para cada módulo ──────────────────────────────────────
const iconReclamos = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const iconExpedientes = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
  </svg>
);
const iconTurnos = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const iconAtencion = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
  </svg>
);

// ── Módulos del sistema ───────────────────────────────────────────────────────
const modulos = [
  {
    href: "/reclamos",
    titulo: "Reclamos ciudadanos",
    descripcion: "Los vecinos cargan reclamos y siguen su estado hasta que se resuelven.",
    icon: iconReclamos,
  },
  {
    href: "/expedientes",
    titulo: "Gestión de expedientes",
    descripcion: "Seguimiento de trámites administrativos, con historial de movimientos.",
    icon: iconExpedientes,
  },
  {
    href: "/turnos",
    titulo: "Gestión de turnos",
    descripcion: "Reserva y administración de turnos para las distintas áreas del municipio.",
    icon: iconTurnos,
  },
  {
    href: "/atencion",
    titulo: "Atención al vecino",
    descripcion: "Registro de consultas e interacciones generales con los vecinos.",
    icon: iconAtencion,
  },
];

export default async function Home() {
  // Leer noticias reales de la DB
  const noticias = await prisma.noticia.findMany({
    where: { publicada: true },
    orderBy: { creadoEn: "desc" },
    take: 7,
  });

  const noticiaDestacada = noticias[0] ?? null;
  const noticiasSecundarias = noticias.slice(1, 4);
  const noticiasBreves = noticias.slice(4, 8);

  const formatFecha = (fecha: Date) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(fecha));

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl space-y-12">

        {/* ── PORTAL DE NOTICIAS ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between border-b-2 border-[#c0000a] pb-3">
            <h2 className="text-xl font-semibold text-zinc-900">
              Noticias del Municipio
            </h2>
            <a href="/noticias" className="text-sm font-medium text-[#c0000a] hover:text-[#8b0007] transition-colors">
              Ver todas →
            </a>
          </div>

          {noticias.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-400">
              No hay noticias publicadas aún.
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Noticia destacada */}
                {noticiaDestacada && (
                  <a
                    href={`/noticias/${noticiaDestacada.id}`}
                    className="lg:col-span-2 flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:border-[#c0000a] transition-colors group"
                  >
                    {noticiaDestacada.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={noticiaDestacada.imagen} alt={noticiaDestacada.titulo} className="h-56 w-full object-cover" />
                    ) : (
                      <div className="h-56 w-full bg-zinc-100 flex items-center justify-center">
                        <span className="text-xs text-zinc-400">Imagen de la noticia</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#c0000a]">
                        {noticiaDestacada.categoria}
                      </span>
                      <h3 className="mt-1 text-lg font-semibold text-zinc-900 group-hover:text-[#c0000a] transition-colors leading-snug">
                        {noticiaDestacada.titulo}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-zinc-600 line-clamp-3">
                        {noticiaDestacada.resumen}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{formatFecha(noticiaDestacada.creadoEn)}</span>
                        <span className="text-sm font-medium text-[#c0000a]">Leer más →</span>
                      </div>
                    </div>
                  </a>
                )}

                {/* Noticias secundarias */}
                <div className="flex flex-col gap-4">
                  {noticiasSecundarias.map((n) => (
                    <a
                      key={n.id}
                      href={`/noticias/${n.id}`}
                      className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-[#c0000a] transition-colors group"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#c0000a]">
                        {n.categoria}
                      </span>
                      <h4 className="mt-1 text-sm font-semibold text-zinc-900 group-hover:text-[#c0000a] transition-colors leading-snug">
                        {n.titulo}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{n.resumen}</p>
                      <span className="mt-2 text-xs text-zinc-400">{formatFecha(n.creadoEn)}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Noticias breves */}
              {noticiasBreves.length > 0 && (
                <div className="mt-6 rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-zinc-100 px-4 py-2 bg-[#fdf2f2]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#c0000a]">
                      Últimas noticias
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100">
                    {noticiasBreves.map((n) => (
                      <li key={n.id} className="flex items-center justify-between px-4 py-2.5">
                        <a href={`/noticias/${n.id}`} className="text-sm text-zinc-700 hover:text-[#c0000a] transition-colors">
                          {n.titulo}
                        </a>
                        <span className="ml-4 shrink-0 text-xs text-zinc-400">{formatFecha(n.creadoEn)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── MÓDULOS DEL SISTEMA ────────────────────────────────────────── */}
        <section>
          <div className="border-b-2 border-[#c0000a] pb-3">
            <h2 className="text-xl font-semibold text-zinc-900">
              Sistema de Gestión Municipal
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Una sola plataforma para reclamos, expedientes, turnos y atención al vecino.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modulos.map((m) => (
              <a
                key={m.href}
                href={m.href}
                className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-[#c0000a] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-[#c0000a] shrink-0">{m.icon}</div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-[#c0000a] transition-colors">
                      {m.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">{m.descripcion}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
