export interface Banco {
    id: number;
    nombre: string;
    saldo: number;
    fecha_creacion: string;                // ISO
    fecha_actualizacion?: string | null;   // ISO | null
}
export type BancoCreate = Omit<Banco, "id" | "fecha_creacion" | "fecha_actualizacion">;
export type BancoUpdate = Omit<Banco, "id" | "fecha_creacion" | "saldo" | "fecha_actualizacion">; // sólo nombre
export type NuevoBanco = BancoCreate;
