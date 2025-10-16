export interface Credito {
  id: number;
  nombre: string;
  monto: number;
  fecha_creacion: string;
}

export interface CreditosPage {
  items: Credito[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type CreditoCreate = {
  nombre: string;
  monto: number;
  fecha_creacion?: string;
};

export type CreditoUpdate = Omit<Credito, "id" | "fecha_creacion">;

export type CreditoUpdateMonto = { monto: number };