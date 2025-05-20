import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../client/src/components/ui/form';
import { Input } from '../../client/src/components/ui/input';
import { Button } from '../../client/src/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { renderWithProviders } from '../utils/test-utils';

// Create a test form component
const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

type TestFormValues = z.infer<typeof testSchema>;

function TestForm({ onSubmit = jest.fn() }: { onSubmit?: (values: TestFormValues) => void }) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-4">Submit</Button>
      </form>
    </Form>
  );
}

describe('Form Component', () => {
  test('renders form fields correctly', () => {
    renderWithProviders(<TestForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('validates input correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestForm />);
    
    // Submit without entering any data
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check validation messages
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Enter valid data
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    
    // Submit again
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that only email validation error remains
    await waitFor(() => {
      expect(screen.queryByText(/name must be at least 2 characters/i)).not.toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Fix email
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    
    // Submit again
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // No validation errors should be shown
    await waitFor(() => {
      expect(screen.queryByText(/name must be at least 2 characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    });
  });

  test('calls onSubmit with form values when validation passes', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<TestForm onSubmit={handleSubmit} />);
    
    // Enter valid data
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that onSubmit was called with correct values
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        expect.anything()
      );
    });
  });
});