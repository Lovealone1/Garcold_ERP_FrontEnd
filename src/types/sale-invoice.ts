import type { Customer } from "@/types/customer";

/* ====== Company ====== */
export interface CompanyDTO {
    id: number;
    razon_social: string;
    nombre_completo: string;
    cc_nit: string;
    email_facturacion: string;
    celular?: string | null;
    direccion: string;
    municipio: string;
    departamento: string;
    codigo_postal?: string | null;
    regimen: "COMUN" | "NO_RESPONSABLE" | "SIMPLE";
}

/* ====== Bank ====== */
export interface SaleInvoiceBankDTO {
    account_number: string;
}

/* ====== Items ====== */
export interface SaleItemViewDesc {
    sale_id: number;
    product_reference: string;
    product_description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

/* ====== Invoice ====== */
export interface SaleInvoiceDTO {
    sale_id: number;
    date: string;                    // ISO "YYYY-MM-DD" o ISO8601
    status: string;
    total: number;
    remaining_balance: number;
    account_number?: SaleInvoiceBankDTO | null;
    customer: Customer;
    company: CompanyDTO;
    items: SaleItemViewDesc[];
}

