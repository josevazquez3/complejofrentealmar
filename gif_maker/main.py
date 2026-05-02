"""
Punto de entrada: aplicación MVC para generar GIF promocionales.

Requisitos: Python 3.10+, moviepy, Pillow (tkinter incluido en la instalación estándar).

Ejemplo:
    python main.py
"""

from __future__ import annotations

import tkinter as tk

from controller import GifMakerController
from model import GifGenerator
from view import GifMakerView


def main() -> None:
    root = tk.Tk()
    vista = GifMakerView(root)
    vista.pack(fill=tk.BOTH, expand=True)
    modelo = GifGenerator()
    GifMakerController(root, vista, modelo)
    root.mainloop()


if __name__ == "__main__":
    main()
