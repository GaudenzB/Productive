import React from "react";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  className?: string;
  size?: "small" | "normal";
}

export function PriorityBadge({ priority, className, size = "normal" }: PriorityBadgeProps) {
  const badgeStyles = {
    HIGH: "bg-destructive text-destructive-foreground",
    MEDIUM: "bg-[#FF9500] text-white",
    LOW: "bg-success text-white",
    COMPLETED: "bg-success text-white",
  };

  const label = priority === "COMPLETED" ? "Completed" : priority.charAt(0) + priority.slice(1).toLowerCase();
  
  const sizeStyles = {
    small: "px-1.5 py-0.5 text-[10px]",
    normal: "px-2 py-1 text-xs"
  };

  return (
    <span
      className={cn(
        "rounded font-medium",
        sizeStyles[size],
        badgeStyles[priority as keyof typeof badgeStyles] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
