export interface CarouselImage {
  id: string;
  url: string;
  storage_path: string;
  orden: number;
  created_at: string;
}

export interface InicioConfig {
  id: string;
  titulo: string;
  descripcion: string;
  fotos: string[];
  updated_at: string;
}

export interface Unidad {
  id: string;
  titulo: string;
  descripcion: string;
  fotos: string[];
  habilitada: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export type SeccionTextoId = "equipamiento" | "servicios";

export interface SeccionTexto {
  id: string;
  titulo: string;
  descripcion: string;
  updated_at: string;
}
