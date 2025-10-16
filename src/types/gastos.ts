export interface Gasto {
    id: number;
    categoria_gasto_id: string;     
    nombre_banco: string;        
    monto: number;
    fecha_gasto: string;   
}

export interface GastosPage {
    items: Gasto[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface GastoCreate {
    categoria_gasto_id: number;
    banco_id: number;
    monto: number;
    fecha_gasto: string;  
}

export interface GastoCreated {
    id: number;
    categoria_gasto_id: number;
    banco_id: number;
    monto: number;
    fecha_gasto: string;   
}
