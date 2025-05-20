import { Task, Project, Meeting, Note, Tag } from "@shared/schema";

/**
 * Find a project by ID in a list of projects
 */
export function findProjectById(projects: Project[] | undefined, projectId: string | null): Project | undefined {
  if (!projectId || !projects || !projects.length) return undefined;
  return projects.find(project => project.id === projectId);
}

/**
 * Get a project name by ID, with fallback for missing projects
 */
export function getProjectName(projects: Project[] | undefined, projectId: string | null): string {
  const project = findProjectById(projects, projectId);
  return project ? project.title : "None";
}

/**
 * Get tasks associated with a specific project
 */
export function getTasksByProject(tasks: Task[] | undefined, projectId: string): Task[] {
  if (!tasks || !tasks.length) return [];
  return tasks.filter(task => task.projectId === projectId);
}

/**
 * Calculate project progress based on completed tasks
 */
export function calculateProjectProgress(tasks: Task[] | undefined, projectId: string): number {
  const projectTasks = getTasksByProject(tasks, projectId);
  if (!projectTasks.length) return 0;
  
  const completedTasks = projectTasks.filter(task => task.status === "COMPLETED");
  return Math.round((completedTasks.length / projectTasks.length) * 100);
}

/**
 * Filter items based on a search query across multiple fields
 */
export function filterItemsBySearchQuery<T>(
  items: T[] | undefined, 
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] {
  if (!items || !items.length || !searchQuery) return items || [];
  
  const query = searchQuery.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      
      // Handle string values
      if (typeof value === 'string') {
        return value.toLowerCase().includes(query);
      }
      
      // For non-string values, convert to string first
      return String(value).toLowerCase().includes(query);
    });
  });
}

/**
 * Sort items by a specific field
 */
export function sortItemsByField<T>(
  items: T[] | undefined, 
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  if (!items || !items.length) return items || [];
  
  return [...items].sort((a, b) => {
    const valueA = a[field];
    const valueB = b[field];
    
    if (valueA === valueB) return 0;
    
    // Handle nulls and undefined
    if (valueA === null || valueA === undefined) return direction === 'asc' ? -1 : 1;
    if (valueB === null || valueB === undefined) return direction === 'asc' ? 1 : -1;
    
    // Sort based on type
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    // For dates
    if (valueA instanceof Date && valueB instanceof Date) {
      return direction === 'asc'
        ? valueA.getTime() - valueB.getTime()
        : valueB.getTime() - valueA.getTime();
    }
    
    // For numbers and other types
    return direction === 'asc'
      ? (valueA < valueB ? -1 : 1)
      : (valueB < valueA ? -1 : 1);
  });
}

/**
 * Group tasks by status and count them
 */
export function getTaskStatusCounts(tasks: Task[] | undefined): Record<string, number> {
  if (!tasks || !tasks.length) {
    return {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0
    };
  }
  
  return tasks.reduce((counts, task) => {
    const status = task.status || 'TODO';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Find a tag by ID in a list of tags
 */
export function findTagById(tags: Tag[] | undefined, tagId: string): Tag | undefined {
  if (!tagId || !tags || !tags.length) return undefined;
  return tags.find(tag => tag.id === tagId);
}

/**
 * Create an ID for new items (temporary solution before backend creates it)
 */
export function generateTemporaryId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}