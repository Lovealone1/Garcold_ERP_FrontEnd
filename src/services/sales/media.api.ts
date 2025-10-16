import salesApi from "../salesApi";
import type { MediaOutDTO } from "@/types/media";

type Opts = { signal?: AbortSignal };

export async function uploadProductFiles(
  args: { product_id: number; files: File[] },
  opts?: Opts
): Promise<MediaOutDTO[]> {
  const fd = new FormData();
  for (const f of args.files.slice(0, 3)) fd.append("files", f, f.name);

  const { data } = await salesApi.post(
    `/media/product/${args.product_id}/upload-files`,
    fd,
    { signal: opts?.signal }
  );
  return data as MediaOutDTO[];
}

export async function listProductMedia(
  product_id: number,
  opts?: Opts
): Promise<MediaOutDTO[]> {
  const { data } = await salesApi.get(`/media/product/${product_id}`, {
    signal: opts?.signal,
  });
  return data as MediaOutDTO[];
}

export async function uploadPurchaseFiles(
  args: { purchase_id: number; files: File[] },
  opts?: Opts
): Promise<MediaOutDTO[]> {
  const fd = new FormData();
  for (const f of args.files.slice(0, 10)) fd.append("files", f, f.name);

  const { data } = await salesApi.post(
    `/media/purchase/${args.purchase_id}/upload-files`,
    fd,
    { signal: opts?.signal }
  );
  return data as MediaOutDTO[];
}

export async function listPurchaseMedia(
  purchase_id: number,
  opts?: Opts
): Promise<MediaOutDTO[]> {
  const { data } = await salesApi.get(`/media/purchase/${purchase_id}`, {
    signal: opts?.signal,
  });
  return data as MediaOutDTO[];
}

export async function deleteMedia(media_id: number): Promise<void> {
  await salesApi.delete(`/media/${media_id}`);
}