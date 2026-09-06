"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose?: () => void;
  /** Deshabilita cerrar con clic en el fondo y con Escape (p. ej. mientras se guarda). */
  locked?: boolean;
  /** Clases extra para el fondo (alineación, z-index…). */
  className?: string;
  /**
   * Color del velo. Va como estilo en línea a propósito: entre dos utilidades
   * de Tailwind como `bg-black/30` y `bg-black/50` gana la que aparezca más
   * tarde en la hoja de estilos, no la que se escriba después en el atributo
   * `class`, así que por clase no se puede sobreescribir de forma fiable.
   */
  scrim?: string;
  labelledBy?: string;
  children: React.ReactNode;
};

/**
 * Fondo de modal, montado en <body> mediante portal.
 *
 * Sustituye al patrón que había repetido por toda la app:
 *
 *     <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
 *
 * Ese patrón se rompía en cuanto un ancestro tenía `filter`, `transform` o
 * `perspective`, porque cualquiera de los tres convierte al ancestro en
 * containing block de los `position: fixed` que cuelgan de él. El shell de la
 * app tenía un `filter: blur(...)` permanente, así que estos overlays se
 * posicionaban contra el frame —del alto del documento— en vez de contra el
 * viewport: en una lista larga el diálogo se centraba fuera de pantalla.
 * Al portalizar a <body> el problema deja de poder repetirse aunque alguien
 * vuelva a introducir un filtro más arriba.
 *
 * Añade además lo que faltaba en todos los sitios: bloqueo del scroll de
 * fondo, cierre con Escape, foco inicial dentro del diálogo, devolución del
 * foco al cerrar, y alto acotado a `dvh` con scroll propio para que un
 * formulario largo con el teclado abierto siga siendo usable.
 */
export default function ModalOverlay({
  open,
  onClose,
  locked = false,
  className = "",
  scrim = "rgba(0,0,0,0.5)",
  labelledBy,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusTo = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  const requestClose = useCallback(() => {
    if (!locked) onClose?.();
  }, [locked, onClose]);

  // Bloqueo del scroll de fondo.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape cierra desde cualquier parte, no solo si el foco está dentro.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  // Lleva el foco al diálogo y devuélvelo al cerrar.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement;

    const node = panelRef.current;
    const focusable = node?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    // Un input recibe el foco de buena gana; si no hay ninguno, el propio
    // contenedor sirve de ancla para que el lector de pantalla entre al diálogo.
    (focusable ?? node)?.focus({ preventScroll: true });

    return () => {
      const target = restoreFocusTo.current;
      if (target instanceof HTMLElement && document.contains(target)) {
        target.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      ref={panelRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      style={{ backgroundColor: scrim }}
      className={
        "fixed inset-0 z-50 overflow-y-auto overscroll-contain " + className
      }
    >
      {/*
        Centrado con un envoltorio `min-h-full` en lugar de `place-items-center`
        sobre el propio fondo. Con el centrado directo, un diálogo más alto que
        la pantalla se desborda por arriba y por abajo a partes iguales, y la
        cabecera queda por encima del origen del scroll: inalcanzable. Así, en
        cuanto el contenido supera la altura disponible el envoltorio crece y el
        diálogo fluye desde arriba, que es lo que hace falta con el teclado
        abierto en un móvil.
      */}
      <div
        className="flex min-h-full items-center justify-center
                   pt-[max(1rem,env(safe-area-inset-top))]
                   pb-[max(1rem,env(safe-area-inset-bottom))]
                   pl-[max(1rem,env(safe-area-inset-left))]
                   pr-[max(1rem,env(safe-area-inset-right))]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
