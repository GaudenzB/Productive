import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Tasks from '../../client/src/pages/tasks-fixed';

// Mock the API calls
jest.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  getQueryFn: jest.fn(),
}));

// Mock components
jest.mock('../../client/src/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('../../client/src/components/layout/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../client/src/components/layout/mobile-menu', () => ({
  MobileMenu: () => <div data-testid="mobile-menu">Mobile Menu</div>,
}));

// Sample task data
const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test Description 1',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: new Date().toISOString(),
    userId: 'user1',
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test Description 2',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: null,
    userId: 'user1',
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Tasks Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mocking the useQuery hook
    jest.spyOn(require('@tanstack/react-query'), 'useQuery')
      .mockImplementation(({ queryKey }) => {
        if (queryKey[0] === '/api/tasks') {
          return { data: mockTasks, isLoading: false };
        }
        if (queryKey[0] === '/api/projects') {
          return { data: [], isLoading: false };
        }
        return { data: null, isLoading: false };
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders tasks list when data is loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Tasks />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Check if both tasks are rendered
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  test('search functionality filters tasks correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Tasks />
      </QueryClientProvider>
    );

    // Wait for tasks to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    // Find search input and type
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'Task 1' } });

    // Task 1 should be visible, Task 2 should be filtered out
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
    });
  });

  test('filter by status works', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Tasks />
      </QueryClientProvider>
    );

    // Wait for tasks to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    // Open filter dialog
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);

    // Select "In Progress" status
    const inProgressButton = screen.getByText('In Progress');
    fireEvent.click(inProgressButton);

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    // Task 2 should be visible, Task 1 should be filtered out
    await waitFor(() => {
      expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });
});