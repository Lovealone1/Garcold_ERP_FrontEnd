"use client";

import salesApi from "../salesApi";

export type Entity = "customers" | "products" | "suppliers";
export type Fmt = "csv" | "xlsx";

export async function exportAny(
    entity: Entity,
    fmt: Fmt = "csv",
    _ts: number = Date.now(),
    signal?: AbortSignal
): Promise<Blob> {
    const res = await salesApi.get("/export", {
        params: { entity, fmt, _ts },
        headers: { "Cache-Control": "no-cache" },
        responseType: "blob",
        signal,
    });
    return res.data as Blob;
}

export async function downloadExport(
    entity: Entity,
    fmt: Fmt = "csv",
    filename?: string,
    _ts: number = Date.now(),
    signal?: AbortSignal
) {
    const blob = await exportAny(entity, fmt, _ts, signal);
    const ext = fmt === "xlsx" ? "xlsx" : "csv";
    const name = filename ?? `${entity}.${ext}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
