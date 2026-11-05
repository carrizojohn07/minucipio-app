"use client";

// Botón de envío que pide confirmación antes de mandar el formulario.
// Tiene que ser un Client Component porque usa window.confirm, que solo existe en el navegador.
export function BotonConfirmar({
  mensaje,
  className,
  children,
}: {
  mensaje: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(mensaje)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
