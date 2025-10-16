export interface Inversion {
  id: number;
  nombre: string;
  saldo: number;
  fecha_vencimiento: string;
}

export interface InversionesPage {
  items: Inversion[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type InversionCreate = {
  nombre: string;
  saldo: number;
  fecha_vencimiento: string;
};

export type InversionUpdate = Omit<Inversion, "id">;

export type InversionUpdateSaldo = { saldo: number };