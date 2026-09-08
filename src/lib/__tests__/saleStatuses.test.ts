import { describe, expect, it } from "vitest";
import { saleStatusOptions } from "../saleStatuses";

describe("saleStatusOptions", () => {
    it("excludes purchase states while preserving the exact API values", () => {
        expect(saleStatusOptions([
            "Venta Credito", "Compra Credito", "Venta Contado", "Compra Cancelada",
            " ventas crédito ", "venta cancelada", "Inventario", "",
        ])).toEqual(["Venta Credito", "Venta Contado", " ventas crédito ", "venta cancelada"]);
    });
});
