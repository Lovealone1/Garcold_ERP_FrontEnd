"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

type Severity = "success" | "info" | "warning" | "error";
type Notice = { id: number; message: React.ReactNode; severity: Severity; autoHideDuration: number };

type Ctx = {
  notify: (msg: unknown, opts?: { severity?: Severity; autoHideDuration?: number }) => void;
  success: (msg: unknown, ms?: number) => void;
  info: (msg: unknown, ms?: number) => void;
  warning: (msg: unknown, ms?: number) => void;
  error: (msg: unknown, ms?: number) => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider/>");
  return ctx;
}

const MAX_STACK = 4;
const DEFAULT_MS = 4000;

// Normaliza cualquier payload a ReactNode
function coerceMessage(input: unknown): React.ReactNode {
  if (input == null) return "";
  if (typeof input === "string" || typeof input === "number") return String(input);
  // Axios/FastAPI comunes
  const detail = (input as any)?.response?.data?.detail ?? (input as any)?.detail ?? input;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // e.g. [{loc, msg, type}]
    return (
      <ul style={{ margin: 0, paddingLeft: "1rem" }}>
        {detail.map((x, i) => (
          <li key={i}>{x?.msg ?? String(x)}</li>
        ))}
      </ul>
    );
  }
  if (detail instanceof Error) return detail.message;
  try {
    return <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(detail, null, 2)}</pre>;
  } catch {
    return String(detail);
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Notice[]>([]);

  const notify = useCallback(
    (message: unknown, opts?: { severity?: Severity; autoHideDuration?: number }) => {
      const item: Notice = {
        id: Date.now() + Math.random(),
        message: coerceMessage(message),
        severity: opts?.severity ?? "info",
        autoHideDuration: opts?.autoHideDuration ?? DEFAULT_MS,
      };
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

      {stack.map((n, idx) => (
        <Snackbar
          key={n.id}
          open
          autoHideDuration={n.autoHideDuration}
          onClose={(e, r) => handleClose(n.id, e, r)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            zIndex: 9999,
            pointerEvents: "none",
            "& .MuiPaper-root": { pointerEvents: "auto" },
            mt: `${8 + idx * 8}px`,
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
