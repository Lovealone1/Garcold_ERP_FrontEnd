"use client";

import salesApi from "../salesApi";

export type Entity = "customers" | "suppliers" | "products";
export type Delimiter = "," | ";" | "tab" | string;

export type ImportOptions = {
    entity: Entity;
    file: File;
    dryRun?: boolean;          // default true
    delimiter?: Delimiter;     // "," ";" "tab" o custom
    sheet?: string | null;     // para .xlsx
    headerRow?: number;        // default backend: 1
    _ts?: number;              // nocache token
    signal?: AbortSignal;
};

export type ImportReport = any; 

export async function importInsert(opts: ImportOptions): Promise<ImportReport> {
    const {
        entity, file, dryRun = true, delimiter, sheet, headerRow,
        _ts = Date.now(), signal,
    } = opts;

    const fd = new FormData();
    fd.append("file", file, file.name);

    const { data } = await salesApi.post("/io/import", fd, {
        params: {
            entity,
            dry_run: dryRun,
            ...(delimiter ? { delimiter } : {}),
            ...(sheet != null && sheet !== "" ? { sheet } : {}),
            ...(headerRow != null ? { header_row: headerRow } : {}),
            _ts,
        },
        headers: { "Cache-Control": "no-cache" },
        signal,
    });

    return data as ImportReport;
}
