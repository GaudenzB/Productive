import { format, isPast, isToday, isTomorrow, addDays, parse, formatDistance } from "date-fns";

/**
 * Format a date with a consistent date format
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy h:mm a");
}

/**
 * Format a time only
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "h:mm a");
}

/**
 * Get a human-readable due date description
 */
export function getDueDateDescription(date: Date | string | null | undefined): string {
  if (!date) return "No due date";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(dateObj)) return "Due today";
  if (isTomorrow(dateObj)) return "Due tomorrow";
  if (isPast(dateObj)) return `Overdue (${formatDate(dateObj)})`;
  
  return `Due ${formatDate(dateObj)}`;
}

/**
 * Calculate duration between two dates in minutes
 */
export function getDurationInMinutes(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  
  return `${hours} hr ${minutes} min`;
}

/**
 * Get relative time (e.g., "5 minutes ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Group an array of items by date
 */
export function groupByDate<T>(
  items: T[], 
  dateField: keyof T, 
  dateFormat: string = "yyyy-MM-dd"
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const dateValue = item[dateField];
    if (!dateValue) return acc;
    
    // Handle string or Date objects
    const date = typeof dateValue === "string" 
      ? format(new Date(dateValue), dateFormat)
      : format(dateValue as Date, dateFormat);
    
    if (!acc[date]) {
      acc[date] = [];
    }
    
    acc[date].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}