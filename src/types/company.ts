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
