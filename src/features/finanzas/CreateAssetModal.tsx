"use client";
import { useMemo, useState, useEffect } from "react";
import { useCreateLoan } from "@/hooks/creditos/useCreateCreditos";
import { useCreateInvestment } from "@/hooks/inversiones/useCreateInversion";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useBancos } from "@/hooks/bancos/useBancos";

type Kind = "loan" | "investment";

export default function CreateAssetModal({
    open, kind, onClose, onCreated,
}: {
    open: boolean;
    kind: Kind;
    onClose: () => void;
    onCreated: (kind: Kind) => void;
}) {
    const [name, setName] = useState("");
    const [value, setValue] = useState<string>("");
    const [dateStr, setDateStr] = useState<string>("");

    // solo para inversiones
    const { items: banks, loading: loadingBanks } = useBancos();
    const [bankId, setBankId] = useState<number | "">("");

    const { create: createLoan, loading: loadingL } = useCreateLoan();
    const { create: createInvestment, loading: loadingI } = useCreateInvestment();
    const { success, error } = useNotifications();
    const loading = loadingL || loadingI;

    useEffect(() => {
        if (!open) return;
        // reset limpio cada vez que se abre
        setName("");
        setValue("");
        setDateStr("");
        setBankId(""); // no preseleccionar banco
    }, [open]);

    const labels = useMemo(
        () => kind === "investment"
            ? { value: "Saldo", date: "Fecha de vencimiento" }
            : { value: "Monto", date: "Fecha de creación" },
        [kind]
    );

    const canSubmit = useMemo(() => {
        const n = Number(value);
        if (!name.trim() || !dateStr || !Number.isFinite(n) || n <= 0) return false;
        if (kind === "investment" && (bankId === "" || loadingBanks)) return false;
        return !loading;
    }, [name, value, dateStr, kind, bankId, loading, loadingBanks]);

    async function submit() {
        if (!canSubmit) return;
        const n = Number(value);

        try {
            if (kind === "loan") {
                await createLoan({ name: name.trim(), amount: n }); // fecha la pone backend
                success("Crédito creado");
            } else {
                // ✅ enviar bank_id obligatorio
                await createInvestment({
                    name: name.trim(),
                    balance: n,
                    maturity_date: dateStr,
                    bank_id: bankId as number,
                });
                success("Inversión creada");
            }
            onCreated(kind);
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error al crear";
            error(msg);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <div className="w-[92vw] max-w-[520px] rounded-2xl border border-tg bg-[var(--panel-bg,white)] p-5 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">
                    {kind === "loan" ? "Nuevo crédito" : "Nueva inversión"}
                </h3>

                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Nombre</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                            placeholder="Descripción"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{labels.value}</label>
                        <input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                            inputMode="numeric"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{labels.date}</label>
                        <input
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                        />
                    </div>

                    {kind === "investment" && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm">Banco</label>
                            <select
                                value={bankId === "" ? "" : String(bankId)}
                                onChange={(e) => setBankId(e.target.value ? Number(e.target.value) : "")}
                                className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                                disabled={loadingBanks}
                                aria-label="Seleccione un banco"
                                style={{ colorScheme: "dark" }}
                            >
                                <option value="" disabled>
                                    Selecciona un banco
                                </option>
                                {banks.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button className="h-9 px-3 rounded border border-tg text-sm" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        className="h-9 px-3 rounded bg-tg-primary text-tg-on-primary text-sm disabled:opacity-50"
                        onClick={submit}
                        disabled={!canSubmit}
                    >
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
}
