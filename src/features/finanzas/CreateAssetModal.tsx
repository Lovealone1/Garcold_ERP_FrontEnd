"use client";
import { useMemo, useState } from "react";
import { useCreateCredito } from "@/hooks/creditos/useCreateCreditos";
import { useCreateInversion } from "@/hooks/inversiones/useCreateInversion";

type Kind = "credito" | "inversion";

export default function CreateAssetModal({
    open,
    kind,
    onClose,
    onCreated,
}: {
    open: boolean;
    kind: Kind;
    onClose: () => void;
    onCreated: (kind: Kind) => void;
}) {
    const [nombre, setNombre] = useState("");
    const [valor, setValor] = useState<string>("");
    const [fecha, setFecha] = useState<string>("");

    const { create: createCredito, loading: loadingC } = useCreateCredito();
    const { create: createInversion, loading: loadingI } = useCreateInversion();
    const loading = loadingC || loadingI;

    const labels = useMemo(() => {
        if (kind === "inversion") return { valor: "Saldo", fecha: "Fecha de vencimiento" };
        return { valor: "Monto", fecha: "Fecha de creación" };
    }, [kind]);

    async function submit() {
        const v = Number(valor);
        if (!nombre || Number.isNaN(v) || v <= 0 || !fecha) return;

        if (kind === "credito") {
            await createCredito({ nombre, monto: v, fecha_creacion: fecha });
        } else {
            await createInversion({ nombre, saldo: v, fecha_vencimiento: fecha });
        }
        setNombre(""); setValor(""); setFecha("");
        onCreated(kind);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <div className="w-[92vw] max-w-[520px] rounded-2xl border border-tg bg-[var(--panel-bg,white)] p-5 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">
                    {kind === "credito" ? "Nuevo crédito" : "Nueva inversión"}
                </h3>

                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Nombre</label>
                        <input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                            placeholder="Descripción"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{labels.valor}</label>
                        <input
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                            inputMode="numeric"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">{labels.fecha}</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        className="h-9 px-3 rounded border border-tg text-sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="h-9 px-3 rounded bg-tg-primary text-tg-on-primary text-sm disabled:opacity-50"
                        onClick={submit}
                        disabled={loading || !nombre || !valor || !fecha}
                    >
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
}
