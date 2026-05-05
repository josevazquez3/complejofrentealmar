import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

/** En desarrollo, sin token, las subidas van a `public/uploads/` (no usar en producción sin Blob). */
function localDevUploadFallback(): boolean {
  if (process.env.VERCEL === "1") return false;
  return process.env.NODE_ENV === "development" && !blobToken();
}

function localUploadsFilePath(safePath: string): string {
  const parts = safePath.split("/").filter(Boolean);
  return path.join(process.cwd(), "public", "uploads", ...parts);
}

/**
 * Sube un archivo público a Vercel Blob (`BLOB_READ_WRITE_TOKEN`), o en desarrollo sin token a `public/uploads/`.
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

  if (localDevUploadFallback()) {
    const filePath = localUploadsFilePath(safePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    const buf = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(await (payload as globalThis.Blob).arrayBuffer());
    await writeFile(filePath, buf);
    const url = `/${["uploads", ...safePath.split("/").filter(Boolean)].join("/")}`;
    return { url };
  }

  const token = blobToken();
  if (!token) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN. En Vercel: Storage → Blob → creá token y agregalo a las variables de entorno. En local: npx vercel env pull .env.local o pegá el token en .env.local."
    );
  }

  const blob = await put(safePath, payload, {
    access: "public",
    contentType: contentType || "application/octet-stream",
    token,
  });
  // Siempre persistir en BD la URL pública completa que devuelve Vercel Blob (https://…storage.vercel…).
  const publicUrl = blob.url;
  if (!publicUrl?.startsWith("https://")) {
    throw new Error(
      "Respuesta de Blob sin URL https pública. Revisá BLOB_READ_WRITE_TOKEN y la cuenta de Vercel Blob."
    );
  }
  return { url: publicUrl };
}

/** Elimina un blob por su URL pública, o el archivo en `public/uploads/` en desarrollo local. */
export async function deleteFromBlob(url: string): Promise<void> {
  if (!url?.trim()) return;

  if (url.startsWith("/uploads/")) {
    if (process.env.NODE_ENV === "development") {
      const rel = url.replace(/^\/uploads\//, "");
      const filePath = localUploadsFilePath(rel);
      try {
        await unlink(filePath);
      } catch {
        /* ya borrado o no existe */
      }
    }
    return;
  }

  const token = blobToken();
  if (!token) {
    return;
  }
  await del(url, { token });
}
