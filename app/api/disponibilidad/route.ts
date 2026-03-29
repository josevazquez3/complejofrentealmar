import { NextRequest, NextResponse } from "next/server";
import { getFechasBloqueadas } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const casaId = req.nextUrl.searchParams.get("casaId");
  if (!casaId) {
    return NextResponse.json({ error: "casaId requerido" }, { status: 400 });
  }
  const fechas = await getFechasBloqueadas(casaId);
  return NextResponse.json(fechas);
}
