import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

/**
 * Get the appropriate icon component for a task status
 */
export function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return CheckCircle;
    case "IN_PROGRESS":
      return Clock;
    case "TODO":
      return Circle;
    default:
      return Circle;
  }
}

/**
 * Get the appropriate CSS color class for a status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "text-green-500";
    case "IN_PROGRESS":
      return "text-blue-500";
    case "TODO":
      return "text-slate-500";
    default:
      return "text-slate-500";
  }
}

/**
 * Get the appropriate background color class for a status
 */
export function getStatusBgColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100";
    case "IN_PROGRESS":
      return "bg-blue-100";
    case "TODO":
      return "bg-slate-100";
    default:
      return "bg-slate-100";
  }
}

/**
 * Get the appropriate icon component for a priority level
 */
export function getPriorityIcon(priority: string) {
  switch (priority) {
    case "HIGH":
      return AlertTriangle;
    case "MEDIUM":
      return Clock;
    case "LOW":
      return Circle;
    default:
      return Circle;
  }
}

/**
 * Get the appropriate CSS color class for a priority
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "text-red-500";
    case "MEDIUM":
      return "text-amber-500";
    case "LOW":
      return "text-blue-500";
    default:
      return "text-slate-500";
  }
}

/**
 * Get human-readable label for a status
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    case "TODO":
      return "To Do";
    default:
      return status;
  }
}

/**
 * Get human-readable label for a priority
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return priority;
  }
}