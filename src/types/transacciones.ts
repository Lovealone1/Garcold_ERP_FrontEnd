export interface TransaccionResponse {
  id: number;
  banco_id: number;
  monto: number;
  tipo_str: string;
  descripcion?: string | null;
  fecha_creacion: string; 
}

export interface TransaccionesPage {
  items: TransaccionResponse[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Transaccion {
  id: number;
  banco_id: number;
  monto: number;
  tipo_id: number;
  descripcion?: string | null;
  fecha_creacion: string; 
}

export interface TransaccionCreated {
  id: number;
  banco_id: number;
  monto: number;
  tipo_id: number;
  descripcion?: string | null;
  fecha_creacion: string; 
}

export interface TransaccionVM extends TransaccionResponse {
  origen: "auto" | "manual";
  locked: boolean; 
}

export type TransaccionCreate = Omit<Transaccion, "id" | "fecha_creacion">;
export type TransaccionUpdate = Omit<Transaccion, "id" | "fecha_creacion">;
export type NuevaTransaccion = TransaccionCreate;


