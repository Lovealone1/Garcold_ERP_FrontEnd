"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

type Props = {
    open: boolean;
    onClose: () => void;
    banco: string;
    ingresos: number;
    retiros: number;
    saldo: number;
};

export default function ExtractoBancarioModal({ open, onClose, banco, ingresos, retiros, saldo }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: {
                    sx: { borderRadius: 2, border: "1px solid var(--panel-border)", bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)" }
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
                Extracto Bancario
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                    Banco: <strong style={{ opacity: 1 }}>{banco}</strong>
                </Typography>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Ingresos Totales</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            + {money.format(ingresos)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-red-500/20 bg-red-500/10 p-3">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Retiros Totales</span>
                        <span className="text-base font-bold text-red-600 dark:text-red-400">
                            - {money.format(retiros)}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-md border border-tg bg-[var(--panel-bg)] p-3">
                        <span className="text-sm font-semibold">Saldo Final</span>
                        <span className={`text-lg font-bold ${saldo < 0 ? "text-red-500" : ""}`}>
                            {money.format(saldo)}
                        </span>
                    </div>
                </div>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
