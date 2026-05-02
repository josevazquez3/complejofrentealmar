"""
Vista Tkinter: formulario para carpeta, parámetros del GIF y estado.
"""

from __future__ import annotations

import tkinter as tk
from tkinter import filedialog, ttk
from typing import Callable, Optional


class GifMakerView(ttk.Frame):
    """Interfaz principal del generador de GIF."""

    def __init__(self, master: tk.Misc, **kwargs) -> None:
        super().__init__(master, **kwargs)
        master.title("GIF promocional — Frente al Mar")
        master.minsize(520, 560)
        master.geometry("560x620")

        self._carpeta = tk.StringVar(value="")
        self._salida = tk.StringVar(value="promo_frente_al_mar.gif")
        self._duracion = tk.DoubleVar(value=2.5)
        self._fps = tk.DoubleVar(value=12.0)
        self._opacidad = tk.DoubleVar(value=28.0)
        self._ken_burns = tk.DoubleVar(value=55.0)
        self._logo = tk.StringVar(value="FM – FRENTE AL MAR")
        self._frase = tk.StringVar(value="Tu lugar frente al mar")
        self._estado = tk.StringVar(value="Listo.")
        self._progreso = tk.DoubleVar(value=0.0)

        self._cmd_seleccionar: Optional[Callable[[], None]] = None
        self._cmd_generar: Optional[Callable[[], None]] = None

        self._construir_ui()

    def _construir_ui(self) -> None:
        pad = {"padx": 12, "pady": 6}
        fila = 0

        ttk.Label(self, text="Carpeta de fotos").grid(row=fila, column=0, sticky="w", **pad)
        frm_c = ttk.Frame(self)
        frm_c.grid(row=fila, column=1, columnspan=2, sticky="ew", **pad)
        self._entry_carpeta = ttk.Entry(frm_c, textvariable=self._carpeta, width=42, state="readonly")
        self._entry_carpeta.pack(side=tk.LEFT, fill=tk.X, expand=True)
        self._btn_carpeta = ttk.Button(frm_c, text="Seleccionar…", command=self._on_seleccionar)
        self._btn_carpeta.pack(side=tk.LEFT, padx=(8, 0))
        fila += 1

        ttk.Label(self, text="Archivo de salida").grid(row=fila, column=0, sticky="w", **pad)
        ttk.Entry(self, textvariable=self._salida, width=44).grid(row=fila, column=1, columnspan=2, sticky="ew", **pad)
        fila += 1

        self._agregar_slider(fila, "Duración por foto (s)", self._duracion, 0.4, 8.0)
        fila += 1
        self._agregar_slider(fila, "FPS del GIF", self._fps, 5.0, 30.0)
        fila += 1
        self._agregar_slider(fila, "Opacidad overlay terracota (%)", self._opacidad, 0.0, 90.0)
        fila += 1
        self._agregar_slider(fila, "Intensidad zoom Ken Burns (%)", self._ken_burns, 0.0, 100.0)
        fila += 1

        ttk.Label(self, text="Texto del logo").grid(row=fila, column=0, sticky="nw", **pad)
        self._txt_logo = tk.Text(self, height=2, width=44, wrap=tk.WORD)
        self._txt_logo.grid(row=fila, column=1, columnspan=2, sticky="ew", **pad)
        self._txt_logo.insert("1.0", self._logo.get())
        fila += 1

        ttk.Label(self, text="Frase inferior").grid(row=fila, column=0, sticky="nw", **pad)
        self._txt_frase = tk.Text(self, height=2, width=44, wrap=tk.WORD)
        self._txt_frase.grid(row=fila, column=1, columnspan=2, sticky="ew", **pad)
        self._txt_frase.insert("1.0", self._frase.get())
        fila += 1

        ttk.Label(self, text="Progreso").grid(row=fila, column=0, sticky="w", **pad)
        self._barra = ttk.Progressbar(
            self,
            maximum=100.0,
            variable=self._progreso,
            mode="determinate",
            length=360,
        )
        self._barra.grid(row=fila, column=1, columnspan=2, sticky="ew", **pad)
        fila += 1

        self._lbl_estado = ttk.Label(self, textvariable=self._estado, foreground="#333")
        self._lbl_estado.grid(row=fila, column=0, columnspan=3, sticky="w", **pad)
        fila += 1

        self._btn_generar = ttk.Button(self, text="Generar GIF", command=self._on_generar)
        self._btn_generar.grid(row=fila, column=1, columnspan=2, sticky="e", **pad)

        self.columnconfigure(1, weight=1)
        self.columnconfigure(2, weight=0)

    def _agregar_slider(
        self,
        fila: int,
        etiqueta: str,
        variable: tk.DoubleVar,
        vmin: float,
        vmax: float,
    ) -> None:
        ttk.Label(self, text=etiqueta).grid(row=fila, column=0, sticky="w", padx=12, pady=4)
        escala = ttk.Scale(
            self,
            from_=vmin,
            to=vmax,
            variable=variable,
            command=lambda _: self._actualizar_etiqueta_valor(fila, variable, etiqueta),
        )
        escala.grid(row=fila, column=1, sticky="ew", padx=(0, 8), pady=4)
        lbl = ttk.Label(self, width=10, anchor="e")
        lbl.grid(row=fila, column=2, sticky="e", padx=12, pady=4)
        setattr(self, f"_lbl_slider_{fila}", lbl)
        self._actualizar_etiqueta_valor(fila, variable, etiqueta)

    def _actualizar_etiqueta_valor(
        self,
        fila: int,
        variable: tk.DoubleVar,
        etiqueta: str,
    ) -> None:
        lbl = getattr(self, f"_lbl_slider_{fila}", None)
        if lbl is None:
            return
        val = float(variable.get())
        if "Duración" in etiqueta:
            lbl.configure(text=f"{val:.1f}")
        elif "FPS" in etiqueta:
            lbl.configure(text=f"{val:.0f}")
        else:
            lbl.configure(text=f"{val:.0f}")

    def _on_seleccionar(self) -> None:
        if self._cmd_seleccionar:
            self._cmd_seleccionar()

    def _on_generar(self) -> None:
        if self._cmd_generar:
            self._cmd_generar()

    def seleccionar_carpeta_dialogo(self) -> Optional[str]:
        ruta = filedialog.askdirectory(title="Carpeta con fotos")
        return ruta or None

    def set_seleccionar_carpeta_command(self, cmd: Callable[[], None]) -> None:
        self._cmd_seleccionar = cmd

    def set_generar_command(self, cmd: Callable[[], None]) -> None:
        self._cmd_generar = cmd

    def set_carpeta(self, ruta: str) -> None:
        self._carpeta.set(ruta)
        self._entry_carpeta.configure(state="normal")
        self._entry_carpeta.delete(0, tk.END)
        self._entry_carpeta.insert(0, ruta)
        self._entry_carpeta.configure(state="readonly")

    def get_carpeta(self) -> str:
        return self._carpeta.get().strip()

    def get_nombre_salida(self) -> str:
        return self._salida.get().strip()

    def get_duracion_por_foto(self) -> float:
        return float(self._duracion.get())

    def get_fps(self) -> float:
        return float(self._fps.get())

    def get_opacidad_terracota_pct(self) -> float:
        return float(self._opacidad.get())

    def get_intensidad_ken_burns_pct(self) -> float:
        return float(self._ken_burns.get())

    def get_texto_logo(self) -> str:
        return self._txt_logo.get("1.0", tk.END).strip()

    def get_texto_inferior(self) -> str:
        return self._txt_frase.get("1.0", tk.END).strip()

    def set_estado(self, texto: str) -> None:
        self._estado.set(texto)

    def set_progreso_pct(self, porcentaje: float) -> None:
        self._progreso.set(max(0.0, min(100.0, porcentaje)))

    def set_generando(self, activo: bool) -> None:
        estado = tk.DISABLED if activo else tk.NORMAL
        self._btn_generar.configure(state=estado)
        self._btn_carpeta.configure(state=estado)
