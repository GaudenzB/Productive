import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render method that includes providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  
  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Common test data
export const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Task description 1',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: new Date('2025-12-31').toISOString(),
    userId: 'user1',
    projectId: null,
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Task description 2',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: null,
    userId: 'user1',
    projectId: 'project1',
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date('2025-01-02').toISOString(),
  },
  {
    id: '3',
    title: 'Completed Task',
    description: 'This task is done',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: new Date('2025-01-15').toISOString(),
    userId: 'user1',
    projectId: null,
    createdAt: new Date('2024-12-01').toISOString(),
    updatedAt: new Date('2025-01-10').toISOString(),
  },
];

export const mockProjects = [
  {
    id: 'project1',
    title: 'Test Project 1',
    description: 'Project description 1',
    userId: 'user1',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'project2',
    title: 'Test Project 2',
    description: 'Project description 2',
    userId: 'user1',
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date('2025-01-02').toISOString(),
  },
];

export const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};