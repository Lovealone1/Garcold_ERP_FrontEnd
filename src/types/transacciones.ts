
export interface TransaccionResponse {
  id: number;
  banco: string;               // ← nombre del banco
  monto: number;
  tipo_str: string;            // ← nombre del tipo
  descripcion?: string | null;
  fecha_creacion: string;      // ISO
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

// Entidad base interna con IDs (útil para crear/editar)
export interface Transaccion {
  id: number;
  banco_id: number;
  monto: number;
  tipo_id: number;
  descripcion?: string | null;
  fecha_creacion: string;      // ISO
}

// Respuesta al crear (el backend actual devuelve IDs)
export interface TransaccionCreated {
  id: number;
  banco_id: number;
  monto: number;
  tipo_id: number;
  descripcion?: string | null;
  fecha_creacion: string;      // ISO
}

// ViewModel en frontend: extiende la respuesta del listado
export interface TransaccionVM extends TransaccionResponse {
  origen: "auto" | "manual";
  locked: boolean;
}

// Tipos para crear/actualizar
export type TransaccionCreate = Omit<Transaccion, "id" | "fecha_creacion">;
export type TransaccionUpdate = Omit<Transaccion, "id" | "fecha_creacion">;
export type NuevaTransaccion = TransaccionCreate;
