import React from "react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function TagBadge({ name, color, className }: TagBadgeProps) {
  // Calculate contrasting text color
  const isLightColor = (color: string) => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const textColor = isLightColor(color) ? "#000000" : "#FFFFFF";

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-xs inline-flex items-center",
        className
      )}
      style={{ 
        backgroundColor: `${color}20`, // Use color with 20% opacity for background
        color: color,
        border: `1px solid ${color}40` // Use color with 40% opacity for border
      }}
    >
      {name}
    </span>
  );
}
