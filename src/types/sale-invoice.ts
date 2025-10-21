import type { Customer } from "@/types/customer";
import { CompanyDTO } from "@/types/company";

export interface SaleInvoiceBankDTO {
    account_number: string;
}

export interface SaleItemViewDesc {
    sale_id: number;
    product_reference: string;
    product_description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface SaleInvoiceDTO {
    sale_id: number;
    date: string;                    
    status: string;
    total: number;
    remaining_balance: number;
    account_number?: SaleInvoiceBankDTO | null;
    customer: Customer;
    company: CompanyDTO;
    items: SaleItemViewDesc[];
}

