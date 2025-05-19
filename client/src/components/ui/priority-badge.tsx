import React from "react";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const badgeStyles = {
    HIGH: "bg-destructive text-destructive-foreground",
    MEDIUM: "bg-[#FF9500] text-white",
    LOW: "bg-success text-white",
    COMPLETED: "bg-success text-white",
  };

  const label = priority === "COMPLETED" ? "Completed" : priority.charAt(0) + priority.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs font-medium",
        badgeStyles[priority as keyof typeof badgeStyles] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
