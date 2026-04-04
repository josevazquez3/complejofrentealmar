"use server";

import { uploadToBlob } from "@/lib/blob";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["jpg", "jpeg", "pdf"]);

export async function uploadAdminComprobante(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Archivo inválido." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: "El archivo supera 5 MB." };
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED.has(ext)) {
    return { ok: false, message: "Solo se permiten .jpg, .jpeg o .pdf." };
  }
  try {
    const pathname = `comprobantes/${crypto.randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadToBlob(pathname, buf, file.type || "application/octet-stream");
    return { ok: true, url };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error al subir." };
  }
}
