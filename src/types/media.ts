export type ContentTypeImage = "image/png" | "image/jpeg" | "image/webp";

export type MediaKindDTO = "PRODUCT" | "INVOICE";

export interface MediaOutDTO {
  id: number;
  kind: MediaKindDTO;
  key: string;
  public_url: string;
}
