"use client";

import { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export type AlertSeverity = "success" | "info" | "warning" | "error";
type AlertItem = { id: number; severity: AlertSeverity; message: string };

export function useAlertCenter() {
  const [alert, setAlert] = useState<AlertItem | null>(null);

  const notify = (severity: AlertSeverity, message: string) => {
    setAlert({ id: Date.now(), severity, message });
  };

  const close = () => setAlert(null);

  return { alert, notify, close };
}

export function AlertHost({
  alert,
  onClose,
  autoHideDuration = 4000,
}: {
  alert: AlertItem | null;
  onClose: () => void;
  autoHideDuration?: number;
}) {
  return (
    <Snackbar
      open={!!alert}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        variant="filled"
        severity={alert?.severity ?? "info"}
        onClose={onClose}
        sx={{ width: "100%" }}
      >
        {alert?.message}
      </Alert>
    </Snackbar>
  );
}
