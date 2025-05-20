// Re-export all utilities from a single file for easier imports

// Common utilities
export { cn } from "../utils";

// Date utilities
export {
  formatDate,
  formatDateTime,
  formatTime,
  getDueDateDescription,
  getDurationInMinutes,
  formatDuration,
  getRelativeTime,
  groupByDate
} from "./date-utils";

// Status and priority utilities
export {
  getStatusIcon,
  getStatusColor,
  getStatusBgColor,
  getPriorityIcon,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel
} from "./status-utils";

// Data transformation utilities
export {
  findProjectById,
  getProjectName,
  getTasksByProject,
  calculateProjectProgress,
  filterItemsBySearchQuery,
  sortItemsByField,
  getTaskStatusCounts,
  findTagById,
  generateTemporaryId
} from "./data-utils";

// Form utilities
export {
  formValidation,
  useAppForm,
  mapServerErrorsToFormErrors,
  formatFormData
} from "./form-utils";

// API utilities
export {
  useApiQuery,
  useApiMutation,
  createApiEndpoint,
  getPaginationParams,
  formatApiErrorMessage
} from "./api-utils";