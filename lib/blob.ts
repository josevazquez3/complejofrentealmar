import { del, put } from "@vercel/blob";

/**
 * Sube un archivo público a Vercel Blob (`BLOB_READ_WRITE_TOKEN` en servidor).
 */
export async function uploadToBlob(
  pathname: string,
  body: Buffer | ArrayBuffer | Uint8Array | Blob,
  contentType: string
): Promise<{ url: string }> {
  const safePath = pathname.replace(/^\/+/, "");
  let payload: Blob | Buffer;
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    payload = body;
  } else if (Buffer.isBuffer(body)) {
    payload = body;
  } else if (body instanceof Uint8Array) {
    payload = Buffer.from(body);
  } else if (body instanceof ArrayBuffer) {
    payload = Buffer.from(new Uint8Array(body));
  } else {
    payload = Buffer.from([]);
  }
  const blob = await put(safePath, payload, {
    access: "public",
    contentType: contentType || "application/octet-stream",
  });
  return { url: blob.url };
}

/** Elimina un blob por su URL pública. */
export async function deleteFromBlob(url: string): Promise<void> {
  if (!url?.trim()) return;
  await del(url);
}
