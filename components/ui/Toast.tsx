"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastKind = "error" | "success";

type ToastState = {
  visible: boolean;
  mensaje: string;
  tipo: ToastKind;
};

export type ToastContextValue = {
  showToast: (mensaje: string, tipo?: ToastKind) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    visible: false,
    mensaje: "",
    tipo: "error",
  });

  const showToast = useCallback((mensaje: string, tipo: ToastKind = "error") => {
    setState({ visible: true, mensaje, tipo });
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    const t = window.setTimeout(() => {
      setState((s) => ({ ...s, visible: false }));
    }, 4000);
    return () => window.clearTimeout(t);
  }, [state.visible, state.mensaje]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {state.visible ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-4 left-1/2 z-[90] max-w-[min(100%,28rem)] -translate-x-1/2 rounded-lg px-6 py-3 text-center text-sm text-white shadow-lg",
              state.tipo === "error" ? "bg-red-600" : "bg-green-600"
            )}
          >
            {state.mensaje}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
