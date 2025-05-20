import React from 'react';
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color: string;
  className?: string;
  onClick?: () => void;
}

export function TagBadge({ name, color, className, onClick }: TagBadgeProps) {
  // Function to determine text color based on background color brightness
  const getTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return black for light backgrounds, white for dark
    return brightness > 128 ? 'text-black' : 'text-white';
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        getTextColor(color),
        onClick && "cursor-pointer hover:opacity-90",
        className
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
}