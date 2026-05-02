"""
Controlador: enlaza la vista con el modelo y el hilo de generación.
"""

from __future__ import annotations

import tkinter as tk
from tkinter import messagebox

from model import GifGenerator, listar_imagenes_en_carpeta
from view import GifMakerView


class GifMakerController:
    def __init__(self, root: tk.Tk, view: GifMakerView, model: GifGenerator) -> None:
        self._root = root
        self._view = view
        self._model = model
        self._hilo = None

        view.set_seleccionar_carpeta_command(self._al_seleccionar_carpeta)
        view.set_generar_command(self._al_generar)

    def _al_seleccionar_carpeta(self) -> None:
        ruta = self._view.seleccionar_carpeta_dialogo()
        if ruta:
            self._view.set_carpeta(ruta)
            n = len(listar_imagenes_en_carpeta(ruta))
            self._view.set_estado(f"Carpeta seleccionada ({n} imagen(es) detectadas).")

    def _al_generar(self) -> None:
        if self._hilo is not None and self._hilo.is_alive():
            return

        carpeta = self._view.get_carpeta()
        nombre = self._view.get_nombre_salida()
        rutas = listar_imagenes_en_carpeta(carpeta)

        ok, msg = self._model.validar_entrada(carpeta, nombre, rutas)
        if not ok:
            messagebox.showwarning("Datos incompletos", msg)
            self._view.set_estado("Error de validación.")
            return

        self._view.set_generando(True)
        self._view.set_progreso_pct(0.0)
        self._view.set_estado("Procesando…")

        self._hilo = self._model.iniciar_generacion_en_hilo(
            carpeta_fotos=carpeta,
            nombre_archivo_salida=nombre,
            duracion_por_foto=self._view.get_duracion_por_foto(),
            fps_salida=self._view.get_fps(),
            opacidad_terracota_pct=self._view.get_opacidad_terracota_pct(),
            intensidad_zoom_pct=self._view.get_intensidad_ken_burns_pct(),
            texto_logo=self._view.get_texto_logo(),
            texto_inferior=self._view.get_texto_inferior(),
            progress_callback=self._progreso_seguro,
            finished_callback=self._finalizado_seguro,
            error_callback=self._error_seguro,
        )

    def _progreso_seguro(self, fraccion: float) -> None:
        pct = max(0.0, min(100.0, fraccion * 100.0))

        def aplicar() -> None:
            self._view.set_progreso_pct(pct)
            self._view.set_estado("Procesando…")

        self._root.after(0, aplicar)

    def _finalizado_seguro(self, ruta_archivo: str) -> None:
        def aplicar() -> None:
            self._view.set_progreso_pct(100.0)
            self._view.set_estado("Completado.")
            self._view.set_generando(False)
            messagebox.showinfo(
                "GIF generado",
                f"El archivo se guardó correctamente:\n\n{ruta_archivo}",
            )

        self._root.after(0, aplicar)

    def _error_seguro(self, mensaje: str) -> None:
        def aplicar() -> None:
            self._view.set_estado(f"Error: {mensaje}")
            self._view.set_generando(False)
            messagebox.showerror("Error al generar el GIF", mensaje)

        self._root.after(0, aplicar)
