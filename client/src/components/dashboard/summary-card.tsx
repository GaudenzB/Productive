import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Layers,
  FolderKanban,
  Calendar,
  FileText,
  Check,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Loader2
} from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  color: "primary" | "success" | "accent";
}

interface SummaryCardProps {
  title: string;
  count: number;
  icon: "layers" | "folder" | "calendar" | "file-text";
  stats: StatItem[];
}

export function SummaryCard({ title, count, icon, stats }: SummaryCardProps) {
  const isLoading = count === -1;

  const getIcon = () => {
    switch (icon) {
      case "layers":
        return <Layers className="h-6 w-6 text-primary" />;
      case "folder":
        return <FolderKanban className="h-6 w-6 text-primary" />;
      case "calendar":
        return <Calendar className="h-6 w-6 text-primary" />;
      case "file-text":
        return <FileText className="h-6 w-6 text-primary" />;
      default:
        return <Layers className="h-6 w-6 text-primary" />;
    }
  };

  const getStatIcon = (stat: StatItem) => {
    if (stat.value === -1) {
      return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    } else if (stat.label === "Done" || stat.label === "Completed") {
      return <Check className="h-4 w-4 mr-1" />;
    } else if (stat.label === "Overdue") {
      return <AlertCircle className="h-4 w-4 mr-1" />;
    } else if (stat.label === "Active") {
      return <TrendingUp className="h-4 w-4 mr-1" />;
    } else if (stat.label === "Upcoming") {
      return <Calendar className="h-4 w-4 mr-1" />;
    } else if (stat.label === "Recent") {
      return <FileText className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  return (
    <Card className="bg-white p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          {isLoading ? (
            <div className="flex items-center h-9">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <h2 className="text-3xl font-bold">{count}</h2>
          )}
          <div className="flex flex-wrap items-center mt-2 text-sm">
            {stats.map((stat, index) => (
              <span 
                key={stat.label} 
                className={cn(
                  "flex items-center mr-3",
                  stat.color === "primary" && "text-primary",
                  stat.color === "success" && "text-success",
                  stat.color === "accent" && "text-accent"
                )}
              >
                {getStatIcon(stat)}
                {stat.value === -1 ? "..." : stat.value} {stat.label}
              </span>
            ))}
          </div>
        </div>
        <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
          {getIcon()}
        </div>
      </div>
    </Card>
  );
}
