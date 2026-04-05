/**
 * Extrae el ID de video de YouTube desde el ID solo o URLs comunes (watch, youtu.be, embed).
 * Devuelve null si no se puede interpretar.
 */
export function extractYoutubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const idOnly = /^[a-zA-Z0-9_-]{11}$/;
  if (idOnly.test(raw)) return raw;

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const seg = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return idOnly.test(seg) ? seg : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && idOnly.test(v)) return v;
      const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1];
      const shortPath = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortPath) return shortPath[1];
    }
  } catch {
    /* no es URL */
  }

  return null;
}
