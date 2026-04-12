import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parsearExcelInventario } from "@/lib/inventario/parsearExcelInventario";

/** Mapea el estado del Excel al valor guardado en `inventario_items.estado`. */
function estadoParaDb(estado: string): string {
  const e = estado.trim().toLowerCase();
  if (e === "baja") return "dado_de_baja";
  return e;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filas = parsearExcelInventario(buffer);

    const omitidas = filas.filter((f) => f.omitida);
    const validas = filas.filter((f) => !f.omitida);

    const errores: string[] = [];
    const dataToInsert: Prisma.InventarioItemCreateManyInput[] = [];

    for (const fila of validas) {
      const nCasa = fila.unidad.trim();
      if (!nCasa) {
        errores.push(`Fila ${fila.filaOriginal ?? "?"}: falta unidad (casa)`);
        continue;
      }

      let casa = await prisma.casa.findFirst({
        where: { nombre: { equals: nCasa, mode: "insensitive" } },
      });
      if (!casa) {
        casa = await prisma.casa.create({
          data: {
            nombre: nCasa,
            capacidadPersonas: 4,
            activa: true,
            fotos: [],
          },
        });
      }

      let categoriaId: string | null = null;
      const nCat = fila.categoria.trim();
      if (nCat) {
        let categoria = await prisma.inventarioCategoria.findFirst({
          where: { nombre: { equals: nCat, mode: "insensitive" } },
        });
        if (!categoria) {
          try {
            categoria = await prisma.inventarioCategoria.create({
              data: { nombre: nCat },
            });
          } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
              categoria = await prisma.inventarioCategoria.findFirst({
                where: { nombre: { equals: nCat, mode: "insensitive" } },
              });
            } else {
              errores.push(`Fila ${fila.filaOriginal ?? "?"}: no se pudo crear la categoría "${nCat}"`);
              continue;
            }
          }
        }
        categoriaId = categoria?.id ?? null;
      }

      const descripcion = fila.notas.trim() ? fila.notas.trim() : null;

      dataToInsert.push({
        casaId: casa.id,
        categoriaId,
        nombre: fila.nombre.trim(),
        descripcion,
        cantidad: fila.cantidad,
        cantidadMin: fila.stockMinimo,
        unidad: "unidad",
        estado: estadoParaDb(fila.estado),
        ubicacion: fila.ubicacion.trim() || null,
        activo: true,
      });
    }

    let count = 0;
    if (dataToInsert.length > 0) {
      const resultado = await prisma.inventarioItem.createMany({
        data: dataToInsert,
      });
      count = resultado.count;
    }

    revalidatePath("/admin/inventario");
    revalidatePath("/admin/dashboard");

    return NextResponse.json({
      importados: count,
      omitidas: omitidas.length,
      detalleOmitidas: omitidas.map((f) => ({
        fila: f.filaOriginal,
        motivo: f.motivo,
      })),
      errores,
    });
  } catch (error) {
    console.error("Error carga masiva inventario:", error);
    return NextResponse.json({ error: "Error interno al procesar el archivo" }, { status: 500 });
  }
}
