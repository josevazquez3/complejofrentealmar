import * as XLSX from "xlsx";

const MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const HEADERS_INVENTARIO = [
  "Nombre",
  "Categoría",
  "Unidad",
  "Cantidad",
  "Estado",
  "Ubicación",
  "Stock mínimo",
  "Notas",
] as const;

const FILA_EJEMPLO: (string | number)[] = [
  'TV Samsung 50"',
  "TV",
  "casa 1",
  1,
  "bueno",
  "dormitorio matrimonial",
  1,
  "Incluye control remoto",
];

/** Filas vacías debajo del ejemplo (el usuario puede agregar más en Excel). */
const FILAS_VACIAS = 200;

const COLS_INVENTARIO = [
  { wch: 30 },
  { wch: 20 },
  { wch: 20 },
  { wch: 12 },
  { wch: 20 },
  { wch: 20 },
  { wch: 12 },
  { wch: 35 },
];

export function generarTemplateInventario(): Blob {
  const wb = XLSX.utils.book_new();

  const vacia = () => Array.from({ length: HEADERS_INVENTARIO.length }, () => "");
  const dataInventario: (string | number)[][] = [
    [...HEADERS_INVENTARIO],
    [...FILA_EJEMPLO],
    ...Array.from({ length: FILAS_VACIAS }, vacia),
  ];

  const wsInv = XLSX.utils.aoa_to_sheet(dataInventario);
  wsInv["!cols"] = COLS_INVENTARIO;
  XLSX.utils.book_append_sheet(wb, wsInv, "Inventario");

  const dataRef: string[][] = [
    ["Valor", "Descripción"],
    ["bueno", "Artículo en perfecto estado"],
    ["regular", "Uso normal, presenta desgaste"],
    ["malo", "Deteriorado, necesita reparación"],
    ["baja", "Dado de baja, fuera de uso"],
    ["", ""],
    ["* Los campos Categoría y Unidad se crean automáticamente si no existen", ""],
    ["* Columnas adicionales serán ignoradas por el sistema", ""],
  ];

  const wsRef = XLSX.utils.aoa_to_sheet(dataRef);
  wsRef["!cols"] = [{ wch: 14 }, { wch: 42 }];
  XLSX.utils.book_append_sheet(wb, wsRef, "Referencia");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: MIME_XLSX });
}
