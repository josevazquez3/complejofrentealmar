"""
Modelo: generación del GIF promocional con MoviePy y utilidades Pillow.
Compatible con MoviePy 2.x (API moderna).
"""

from __future__ import annotations

import os
import threading
from typing import Callable, List, Optional, Tuple

import numpy as np
from moviepy import ColorClip, CompositeVideoClip, ImageClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFont

EXTENSIONES_VALIDAS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}

# Terracota suave (RGB)
COLOR_TERRACOTA = (186, 108, 91)

# Limitar tamaño para rendimiento razonable en GIF
MAX_LADO = 1280


def _extension_valida(ruta: str) -> bool:
    return os.path.splitext(ruta)[1].lower() in EXTENSIONES_VALIDAS


def listar_imagenes_en_carpeta(carpeta: str) -> List[str]:
    """Lista rutas de imagen ordenadas por nombre (sin validar lectura)."""
    if not carpeta or not os.path.isdir(carpeta):
        return []
    rutas = []
    for nombre in sorted(os.listdir(carpeta)):
        ruta = os.path.join(carpeta, nombre)
        if os.path.isfile(ruta) and _extension_valida(ruta):
            rutas.append(ruta)
    return rutas


def _cargar_fuente(tamaño: int):
    candidatos = [
        os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "arial.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidatos:
        if path and os.path.isfile(path):
            try:
                return ImageFont.truetype(path, tamaño)
            except OSError:
                continue
    return ImageFont.load_default()


def _ajustar_cover(im: Image.Image, ancho: int, alto: int) -> Image.Image:
    """Escala y recorta centrado (object-fit: cover)."""
    im = im.convert("RGB")
    iw, ih = im.size
    escala = max(ancho / iw, alto / ih)
    nw, nh = int(iw * escala), int(ih * escala)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - ancho) // 2
    top = (nh - alto) // 2
    return im.crop((left, top, left + ancho, top + alto))


def _tamano_salida_desde_primera(ruta_primera: str) -> Tuple[int, int]:
    with Image.open(ruta_primera) as im:
        w, h = im.size
    escala = min(1.0, MAX_LADO / max(w, h))
    return max(1, int(w * escala)), max(1, int(h * escala))


def _clip_texto_rgba(
    texto: str,
    ancho_canvas: int,
    alto_canvas: int,
    tam_fuente: int,
    color: Tuple[int, int, int],
    posicion: str,
    margen: int,
    duracion: float,
) -> Optional[ImageClip]:
    """Capa de texto con canal alpha para CompositeVideoClip."""
    texto = (texto or "").strip()
    if not texto:
        return None

    fuente = _cargar_fuente(tam_fuente)
    capa = Image.new("RGBA", (ancho_canvas, alto_canvas), (0, 0, 0, 0))
    dibujo = ImageDraw.Draw(capa)

    bbox = dibujo.textbbox((0, 0), texto, font=fuente)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (ancho_canvas - tw) // 2
    if posicion == "top":
        y = margen
    else:
        y = alto_canvas - th - margen

    dibujo.text((x, y), texto, font=fuente, fill=color + (255,))
    arr = np.array(capa)
    rgb = arr[:, :, :3].astype(np.uint8)
    alpha = arr[:, :, 3].astype(np.float32) / 255.0

    rgb_clip = ImageClip(rgb).with_duration(duracion)
    mask_clip = ImageClip(alpha, is_mask=True).with_duration(duracion)
    return rgb_clip.with_mask(mask_clip)


def _ken_burns_transform(duracion_clip: float, intensidad_relativa: float):
    """
    intensidad_relativa: 0..1 controla cuánto zoom total hay en el clip.
    Zoom lineal de 1.0 a (1 + zoom_delta).
    """
    zoom_delta = 0.04 + 0.14 * max(0.0, min(1.0, intensidad_relativa))

    def filtro(get_frame, t):
        img = get_frame(t)
        pil = Image.fromarray(img)
        z = 1.0 + zoom_delta * (t / duracion_clip if duracion_clip > 0 else 0.0)
        w, h = pil.size
        nw, nh = int(w * z), int(h * z)
        pil = pil.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - w) // 2
        top = (nh - h) // 2
        pil = pil.crop((left, top, left + w, top + h))
        return np.array(pil)

    return filtro


class GifGenerator:
    """Generador de GIF animado estilo promocional (Ken Burns + overlay terracota + textos)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cancelado = False

    def cancelar(self) -> None:
        with self._lock:
            self._cancelado = True

    def _esta_cancelado(self) -> bool:
        with self._lock:
            return self._cancelado

    def reiniciar_cancelacion(self) -> None:
        with self._lock:
            self._cancelado = False

    @staticmethod
    def validar_entrada(
        carpeta: str,
        nombre_salida: str,
        rutas_imagenes: List[str],
    ) -> Tuple[bool, str]:
        if not carpeta or not carpeta.strip():
            return False, "Seleccioná una carpeta de fotos."
        if not os.path.isdir(carpeta):
            return False, "La carpeta no existe o no es accesible."
        if not nombre_salida or not nombre_salida.strip():
            return False, "Indicá un nombre para el archivo de salida."
        nombre_limpio = nombre_salida.strip()
        invalidos = '<>:"/\\|?*'
        if any(c in nombre_limpio for c in invalidos):
            return False, "El nombre contiene caracteres no permitidos."
        if not rutas_imagenes:
            return False, "No hay imágenes válidas en la carpeta."
        return True, ""

    def generar_video_premium(
        self,
        carpeta_fotos: str,
        nombre_archivo_salida: str,
        duracion_por_foto: float,
        fps_salida: float,
        opacidad_terracota_pct: float,
        intensidad_zoom_pct: float,
        texto_logo: str,
        texto_inferior: str,
        progress_callback: Optional[Callable[[float], None]] = None,
        finished_callback: Optional[Callable[[str], None]] = None,
        error_callback: Optional[Callable[[str], None]] = None,
    ) -> None:
        """
        Genera un GIF animado a partir de las fotos de la carpeta.

        Parámetros de UI típicos:
        - duracion_por_foto: segundos por imagen en la línea de tiempo.
        - fps_salida: FPS del archivo GIF resultante.
        - opacidad_terracota_pct / intensidad_zoom_pct: 0..100.
        """
        try:
            self.reiniciar_cancelacion()
            rutas = listar_imagenes_en_carpeta(carpeta_fotos)
            ok, msg = self.validar_entrada(carpeta_fotos, nombre_archivo_salida, rutas)
            if not ok:
                raise ValueError(msg)

            salida = nombre_archivo_salida.strip()
            if not salida.lower().endswith(".gif"):
                salida += ".gif"
            ruta_destino = os.path.join(carpeta_fotos, salida)

            if progress_callback:
                progress_callback(0.05)

            # Verificar que al menos una imagen se puede abrir
            abiertas: List[str] = []
            for r in rutas:
                try:
                    with Image.open(r) as _:
                        abiertas.append(r)
                except OSError:
                    continue
            if not abiertas:
                raise ValueError("No se pudo leer ninguna imagen (formato dañado o no soportado).")

            ancho, alto = _tamano_salida_desde_primera(abiertas[0])
            duracion = max(0.1, float(duracion_por_foto))
            fps = max(1.0, min(50.0, float(fps_salida)))
            opacidad = max(0.0, min(1.0, float(opacidad_terracota_pct) / 100.0))
            intensidad_kb = max(0.0, min(1.0, float(intensidad_zoom_pct) / 100.0))

            n = len(abiertas)
            clips_finales = []

            for indice, ruta_img in enumerate(abiertas):
                if self._esta_cancelado():
                    raise RuntimeError("Generación cancelada.")

                with Image.open(ruta_img) as im_raw:
                    im = _ajustar_cover(im_raw, ancho, alto)

                base = ImageClip(np.array(im)).with_duration(duracion).with_fps(fps)
                zoom_clip = base.transform(_ken_burns_transform(duracion, intensidad_kb))

                terr = ColorClip(
                    (ancho, alto),
                    color=COLOR_TERRACOTA,
                    duration=duracion,
                ).with_opacity(opacidad)

                fuente_logo = max(22, min(64, ancho // 22))
                fuente_pie = max(16, min(48, ancho // 28))

                capas = [
                    zoom_clip,
                    terr,
                ]
                logo_clip = _clip_texto_rgba(
                    texto_logo,
                    ancho,
                    alto,
                    fuente_logo,
                    (255, 248, 240),
                    "top",
                    int(alto * 0.06),
                    duracion,
                )
                pie_clip = _clip_texto_rgba(
                    texto_inferior,
                    ancho,
                    alto,
                    fuente_pie,
                    (255, 250, 245),
                    "bottom",
                    int(alto * 0.06),
                    duracion,
                )
                if logo_clip is not None:
                    capas.append(logo_clip)
                if pie_clip is not None:
                    capas.append(pie_clip)

                comp = CompositeVideoClip(capas, size=(ancho, alto))
                clips_finales.append(comp)

                if progress_callback:
                    avance = 0.05 + 0.75 * (indice + 1) / n
                    progress_callback(avance)

            if self._esta_cancelado():
                raise RuntimeError("Generación cancelada.")

            if progress_callback:
                progress_callback(0.82)

            final = concatenate_videoclips(clips_finales, method="compose")

            if progress_callback:
                progress_callback(0.88)

            final.write_gif(ruta_destino, fps=fps, loop=0, logger=None)

            for c in clips_finales:
                try:
                    c.close()
                except Exception:
                    pass
            try:
                final.close()
            except Exception:
                pass

            if progress_callback:
                progress_callback(1.0)

            if finished_callback:
                finished_callback(ruta_destino)

        except Exception as exc:
            mensaje = str(exc) if str(exc) else exc.__class__.__name__
            if error_callback:
                error_callback(mensaje)
            else:
                raise

    def iniciar_generacion_en_hilo(
        self,
        carpeta_fotos: str,
        nombre_archivo_salida: str,
        duracion_por_foto: float,
        fps_salida: float,
        opacidad_terracota_pct: float,
        intensidad_zoom_pct: float,
        texto_logo: str,
        texto_inferior: str,
        progress_callback: Optional[Callable[[float], None]] = None,
        finished_callback: Optional[Callable[[str], None]] = None,
        error_callback: Optional[Callable[[str], None]] = None,
    ) -> threading.Thread:
        """
        Lanza `generar_video_premium` en un hilo en segundo plano para no bloquear la UI.
        Devuelve el objeto Thread por si se necesita join o depuración.
        """

        def trabajo() -> None:
            self.generar_video_premium(
                carpeta_fotos=carpeta_fotos,
                nombre_archivo_salida=nombre_archivo_salida,
                duracion_por_foto=duracion_por_foto,
                fps_salida=fps_salida,
                opacidad_terracota_pct=opacidad_terracota_pct,
                intensidad_zoom_pct=intensidad_zoom_pct,
                texto_logo=texto_logo,
                texto_inferior=texto_inferior,
                progress_callback=progress_callback,
                finished_callback=finished_callback,
                error_callback=error_callback,
            )

        hilo = threading.Thread(target=trabajo, daemon=True)
        hilo.start()
        return hilo
