import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractYoutubeVideoId } from "@/lib/youtube-id";
import { prisma } from "@/lib/prisma";

async function requireEditor(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (session.user.rol === "EMPLEADO") {
    return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
  }
  return null;
}

/** Configuración editable del sitio (video YouTube, etc.). Sesión admin requerida. */
export async function GET() {
  const denied = await requireEditor();
  if (denied) return denied;

  try {
    const row = await prisma.configuracion.findFirst();
    return NextResponse.json({ youtubeVideoId: row?.youtubeVideoId ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al leer.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireEditor();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const raw =
    typeof body === "object" && body !== null && "youtubeVideoId" in body
      ? String((body as { youtubeVideoId?: unknown }).youtubeVideoId ?? "")
      : "";

  const trimmed = raw.trim();
  const idToStore = trimmed === "" ? null : extractYoutubeVideoId(trimmed);

  if (trimmed !== "" && !idToStore) {
    return NextResponse.json(
      { error: "No se pudo interpretar el ID o la URL de YouTube (formato watch, youtu.be o ID de 11 caracteres)." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.configuracion.findFirst();
    if (!existing) {
      return NextResponse.json(
        {
          error:
            "No hay fila en configuración. Creala primero desde Admin → Configuración (datos del complejo) con Guardar.",
        },
        { status: 409 }
      );
    }

    await prisma.configuracion.update({
      where: { id: existing.id },
      data: { youtubeVideoId: idToStore },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/configuracion/editar");

    return NextResponse.json({ ok: true, youtubeVideoId: idToStore });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
