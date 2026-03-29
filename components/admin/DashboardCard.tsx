"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardCard({
  title,
  value,
  icon: Icon,
  delay = 0,
  valueClassName,
}: {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  delay?: number;
  valueClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-nautico-900/10 shadow-md transition-shadow hover:shadow-lg">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-arena-100 text-arena-600">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-nautico-700/80">{title}</p>
            <p className={cn("font-display text-3xl font-semibold text-nautico-900", valueClassName)}>{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
