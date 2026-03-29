"use client";

import { Toaster } from "sonner";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster richColors position="top-center" />
    </ToastProvider>
  );
}
