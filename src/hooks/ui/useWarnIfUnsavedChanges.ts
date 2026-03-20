"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useWarnIfUnsavedChanges(
    isDirty: boolean,
    onBlock: (proceed: () => void) => void
) {
    const onBlockRef = useRef(onBlock);

    // Mantenemos la referencia fresca en cada render sin disparar el useEffect principal
    useEffect(() => {
        onBlockRef.current = onBlock;
    }, [onBlock]);

    useEffect(() => {
        if (!isDirty) return;

        // 1. Recargar pestaña nativa
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 2. Interceptar enlaces directos <a> de la UI (Sidebar y Header)
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            
            if (target && target.href && target.target !== "_blank") {
                const isExternal = target.href.startsWith("http") && !target.href.includes(window.location.host);
                
                // Si es un link real que cambia de URL dentro de la misma app
                if (!isExternal && target.href !== window.location.href) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    onBlockRef.current(() => {
                        window.location.href = target.href; // Redirección rígida
                    });
                }
            }
        };
        document.addEventListener("click", handleClick, { capture: true });

        // 3. Interceptar el evento "Atrás" de NEXT.js
        // Forzamos un estado falso para que el botón atrás no nos saque de la página inmediatamente
        history.pushState(null, "", window.location.href);
        const handlePopState = (e: PopStateEvent) => {
            history.pushState(null, "", window.location.href);
            onBlockRef.current(() => {
                // Go back two steps (jump over the fake state of ours)
                history.go(-2);
            });
        };
        window.addEventListener("popstate", handlePopState);

        // 4. Parchear pushState para llamadas impuestas de router.push() no asociadas a <a>
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            onBlockRef.current(() => {
                history.pushState = originalPushState;
                originalPushState.apply(history, args);
            });
        };

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("click", handleClick, { capture: true });
            window.removeEventListener("popstate", handlePopState);
            history.pushState = originalPushState;
        };
    }, [isDirty]);
}
