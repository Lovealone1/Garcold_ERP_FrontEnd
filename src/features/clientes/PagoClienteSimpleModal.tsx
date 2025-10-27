// features/clientes/PagoClienteModalV2.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { listBanks } from "@/services/sales/bank.api";
import { createCustomerSimplePayment } from "@/services/sales/customer.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { Bank } from "@/types/bank";

type Props = {
    open: boolean;
    customerId: number | null;
    customerName?: string;
    customerBalance?: number;
    onClose: () => void;
    onSuccess?: (customerId: number, paid: number) => Promise<void> | void; // el padre recarga aquí
};

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function PagoClienteModal({
    open,
    customerId,
    customerName,
    customerBalance = 0,
    onClose,
    onSuccess,
}: Props) {
    const { success, error } = useNotifications();
    const mounted = useRef(true);

    const [banks, setBanks] = useState<Bank[]>([]);
    const [bankId, setBankId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    // mount guard
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    // reset al abrir
    useEffect(() => {
        if (!open) return;
        setBankId("");
        setAmount("");
        setDesc("");
        setErrMsg(null);
    }, [open, customerId]);

    // cargar bancos al abrir
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const data = await listBanks(Date.now());
                if (mounted.current) setBanks(data);
            } catch {
                if (mounted.current) setBanks([]);
            }
        })();
    }, [open]);

    const canSubmit = useMemo(() => {
        const n = Number(amount);
        return Boolean(open && customerId && bankId && Number.isFinite(n) && n > 0);
    }, [open, customerId, bankId, amount]);

    async function handleSubmit() {
        if (!customerId) return;
        if (!canSubmit) {
            error("Selecciona banco y un monto válido");
            return;
        }
        setLoading(true);
        setErrMsg(null);
        try {
            const ok = await createCustomerSimplePayment(customerId, {
                bank_id: Number(bankId),
                amount: Number(amount),
                description: desc || undefined,
            });
            if (!ok) {
                setErrMsg("No se registró el pago");
                return;
            }

            // cerrar primero
            onClose();

            // notificar padre sin bloquear UI
            onSuccess?.(customerId, Number(amount));

            // feedback
            success("Pago registrado");
        } catch (e: any) {
            const msg = e?.response?.data?.detail ?? e?.message ?? "Error registrando el pago";
            setErrMsg(msg);
            error(msg);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            keepMounted={false}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        border: "1px solid var(--panel-border)",
                        bgcolor: "var(--tg-card-bg)",
                        color: "var(--tg-card-fg)",
                    },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1.5 }}>
                {customerName ? `Abono a cliente: ${customerName}` : "Registrar pago"}
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                {customerId && (
                    <div className="mb-4 rounded-lg border border-tg p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-sm opacity-80">ID cliente: {customerId}</div>
                            <div className="px-2 py-1 rounded bg-black/10 text-xs">
                                Saldo: {money.format(customerBalance)}
                            </div>
                        </div>
                    </div>
                )}

                {errMsg && (
                    <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                        {errMsg}
                    </div>
                )}

                <Stack gap={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Registrar pago</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <select
                                className="h-11 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                                value={bankId}
                                onChange={(e) => setBankId((e.target.value ? Number(e.target.value) : "") as any)}
                                disabled={!open || loading}
                            >
                                <option value="">{banks.length ? "Selecciona banco" : "Cargando bancos..."}</option>
                                {banks.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                className="h-11 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                                placeholder="Monto a abonar"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <input
                                type="text"
                                className="h-11 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                                placeholder="Descripción (opcional)"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !canSubmit}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        bgcolor: "var(--tg-primary)",
                        color: "var(--tg-primary-fg)",
                        "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                    }}
                >
                    {loading ? "Guardando…" : "Registrar pago"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
