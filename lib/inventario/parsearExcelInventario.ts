import * as XLSX from "xlsx";

export type EstadoInventario = "bueno" | "regular" | "malo" | "baja";

export type FilaParsedaInventario = {
  nombre: string;
  categoria: string;
  unidad: string;
  cantidad: number;
  estado: EstadoInventario;
  ubicacion: string;
  stockMinimo: number;
  notas: string;
  omitida?: boolean;
  motivo?: string;
  filaOriginal?: number;
};

type CampoDestino =
  | "nombre"
  | "categoria"
  | "unidad"
  | "cantidad"
  | "estado"
  | "ubicacion"
  | "stockMinimo"
  | "notas";

/**
 * Quita tildes, minúsculas, trim y colapsa espacios internos.
 */
export function normalizarHeader(str: string): string {
  const t = String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  return t;
}

function construirMapaAliases(): Map<string, CampoDestino> {
  const entradas: [CampoDestino, string[]][] = [
    ["nombre", ["nombre", "articulo", "article", "item", "descripcion", "name"]],
    ["categoria", ["categoria", "category", "rubro"]],
    ["unidad", ["unidad", "casa", "unit", "propiedad"]],
    ["cantidad", ["cantidad", "quantity", "qty", "stock"]],
    ["estado", ["estado", "condition", "condicion"]],
    ["ubicacion", ["ubicacion", "location", "lugar", "ambiente"]],
    ["stockMinimo", ["stock minimo", "min stock", "minimo", "stock min"]],
    ["notas", ["notas", "observaciones", "notes", "comentarios"]],
  ];
  const map = new Map<string, CampoDestino>();
  for (const [campo, aliases] of entradas) {
    for (const a of aliases) {
      map.set(normalizarHeader(a), campo);
    }
  }
  return map;
}

const MAPA_ALIASES = construirMapaAliases();

function normalizarValorEstado(raw: unknown): string {
  return normalizarHeader(String(raw ?? ""));
}

function parsearEstadoInventario(raw: unknown): EstadoInventario {
  const v = normalizarValorEstado(raw);
  if (!v) return "bueno";
  if (v === "bueno" || v === "good") return "bueno";
  if (v === "regular" || v === "normal") return "regular";
  if (v === "malo" || v === "bad" || v === "roto") return "malo";
  if (v === "baja" || v === "dado de baja") return "baja";
  return "bueno";
}

function enteroDesdeCelda(raw: unknown, predeterminado: number): number {
  if (raw === "" || raw === null || raw === undefined) return predeterminado;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  const s = String(raw).trim().replace(",", ".");
  if (!s) return predeterminado;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return predeterminado;
  return Math.trunc(n);
}

type ValoresPorCampo = Record<CampoDestino, string>;

function valoresVacios(): ValoresPorCampo {
  return {
    nombre: "",
    categoria: "",
    unidad: "",
    cantidad: "",
    estado: "",
    ubicacion: "",
    stockMinimo: "",
    notas: "",
  };
}

function mapearFilaDesdeObjeto(
  row: Record<string, unknown>,
  mapa: Map<string, CampoDestino>
): ValoresPorCampo {
  const out = valoresVacios();
  for (const [headerOriginal, valor] of Object.entries(row)) {
    const key = normalizarHeader(headerOriginal);
    if (!key) continue;
    const campo = mapa.get(key);
    if (!campo) continue;
    const str = valor === null || valor === undefined ? "" : String(valor).trim();
    if (out[campo] === "") {
      out[campo] = str;
    }
  }
  return out;
}

function construirFila(
  v: ValoresPorCampo,
  filaOriginal: number
): FilaParsedaInventario {
  const nombre = v.nombre.trim();
  if (!nombre) {
    return {
      nombre: "",
      categoria: "",
      unidad: "",
      cantidad: 1,
      estado: "bueno",
      ubicacion: "",
      stockMinimo: 0,
      notas: "",
      omitida: true,
      motivo: "sin nombre",
      filaOriginal,
    };
  }

  return {
    nombre,
    categoria: v.categoria.trim(),
    unidad: v.unidad.trim(),
    cantidad: enteroDesdeCelda(v.cantidad, 1),
    estado: parsearEstadoInventario(v.estado),
    ubicacion: v.ubicacion.trim(),
    stockMinimo: enteroDesdeCelda(v.stockMinimo, 0),
    notas: v.notas.trim(),
    filaOriginal,
  };
}

/**
 * Lee la primera hoja de un Excel de inventario y devuelve filas parseadas.
 * No lanza: ante error de lectura o formato devuelve `[]`.
 */
export function parsearExcelInventario(buffer: ArrayBuffer): FilaParsedaInventario[] {
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    if (!Array.isArray(rows)) return [];

    const salida: FilaParsedaInventario[] = [];
    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const v = mapearFilaDesdeObjeto(row, MAPA_ALIASES);
      const filaOriginal = index + 2;
      salida.push(construirFila(v, filaOriginal));
    });
    return salida;
  } catch {
    return [];
  }
}

/*
export function testParser() {
  // Headers de prueba: ["ARTÍCULO", "Casa", "CATEGORÍA ", "Qty", "Condicion", "Lugar"]
  const wb = XLSX.utils.book_new();
  const data = [
    ["ARTÍCULO", "Casa", "CATEGORÍA ", "Qty", "Condicion", "Lugar"],
    ["Sillón living", "Casa 1", "Muebles", "3", "good", "Living"],
    ["", "Casa 2", "—", "1", "", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const out = parsearExcelInventario(buf);
  console.log("parsearExcelInventario (test):", JSON.stringify(out, null, 2));
  // Esperado: 1ª fila con nombre "Sillón living", unidad "Casa 1", categoria "Muebles", cantidad 3, estado "bueno", ubicacion "Living"
  //          2ª fila omitida: sin nombre
}
*/
