import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ["image/gif", "image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 50 * 1024 * 1024,
        tokenPayload: pathname,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
