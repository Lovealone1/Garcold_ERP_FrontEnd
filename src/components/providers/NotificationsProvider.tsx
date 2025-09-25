"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

type Severity = "success" | "info" | "warning" | "error";
type Notice = { id: number; message: string; severity: Severity; autoHideDuration: number };

type Ctx = {
    notify: (msg: string, opts?: { severity?: Severity; autoHideDuration?: number }) => void;
    success: (msg: string, ms?: number) => void;
    info: (msg: string, ms?: number) => void;
    warning: (msg: string, ms?: number) => void;
    error: (msg: string, ms?: number) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function useNotifications(): Ctx {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider/>");
    return ctx;
}

// Mostrar hasta N simultáneas, centradas arriba
const MAX_STACK = 4;
const DEFAULT_MS = 4000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [stack, setStack] = useState<Notice[]>([]);

    const notify = useCallback(
        (message: string, opts?: { severity?: Severity; autoHideDuration?: number }) => {
            const item: Notice = {
                id: Date.now() + Math.random(),
                message,
                severity: opts?.severity ?? "info",
                autoHideDuration: opts?.autoHideDuration ?? DEFAULT_MS,
            };
            // agrega y recorta si supera el máximo
            setStack((s) => {
                const next = [...s, item];
                return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
            });
        },
        []
    );

    const value = useMemo<Ctx>(
        () => ({
            notify,
            success: (m, ms) => notify(m, { severity: "success", autoHideDuration: ms }),
            info: (m, ms) => notify(m, { severity: "info", autoHideDuration: ms }),
            warning: (m, ms) => notify(m, { severity: "warning", autoHideDuration: ms }),
            error: (m, ms) => notify(m, { severity: "error", autoHideDuration: ms }),
        }),
        [notify]
    );

    const handleClose = (id: number, _: any, reason?: string) => {
        if (reason === "clickaway") return;
        setStack((s) => s.filter((n) => n.id !== id));
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}

            {/* Snackbars apiladas: top-center, se sobreponen si no hay espacio */}
            {stack.map((n, idx) => (
                <Snackbar
                    key={n.id}
                    open
                    autoHideDuration={n.autoHideDuration}
                    onClose={(e, r) => handleClose(n.id, e, r)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    sx={{
                        zIndex: 9999,               // por encima de modales base
                        pointerEvents: "none",      // no bloquea clicks en fondo
                        "& .MuiPaper-root": { pointerEvents: "auto" }, // pero permite cerrar el alert
                        mt: `${8 + idx * 8}px`,     // separación vertical sencilla (8px, 16px, 24px, ...)
                    }}
                >
                    <Alert
                        variant="filled"
                        severity={n.severity}
                        onClose={(e) => handleClose(n.id, e)}
                        sx={{ width: "100%", minWidth: 360 }}
                    >
                        {n.message}
                    </Alert>
                </Snackbar>
            ))}
        </NotificationsContext.Provider>
    );
}
