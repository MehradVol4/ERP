"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/lib/preferences";
import { fetchLowStockProducts } from "@/lib/low-stock";

// Live count of products needing restock, shown on the Low Stock sidebar item.
// Renders nothing when inventory is healthy.
export function LowStockBadge() {
  const prefs = usePreferences();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchLowStockProducts(prefs.lowStockThreshold)
      .then((rows) => {
        if (active) setCount(rows.length);
      })
      .catch(() => {
        // stay quiet if it fails
      });
    return () => {
      active = false;
    };
  }, [prefs.lowStockThreshold]);

  if (count <= 0) return null;

  return (
    <Badge
      variant="destructive"
      className="ml-auto h-5 min-w-5 justify-center px-1 tabular-nums"
    >
      {count}
    </Badge>
  );
}
