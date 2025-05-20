import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { InsertTag } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const tagFormSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().default('#4f46e5'),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagDialog({ open, onOpenChange }: TagDialogProps) {
  const { toast } = useToast();
  const [color, setColor] = useState('#4f46e5');

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: '#4f46e5',
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      const res = await apiRequest('POST', '/api/tags', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      form.reset();
      onOpenChange(false);
      toast({
        title: 'Tag created',
        description: 'Your tag has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TagFormValues) => {
    createTagMutation.mutate(data as InsertTag);
  };

  const predefinedColors = [
    '#4f46e5', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#6b7280', // Gray
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tag name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {predefinedColors.map((colorOption) => (
                        <div
                          key={colorOption}
                          className={`h-8 w-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                            field.value === colorOption ? 'ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: colorOption }}
                          onClick={() => {
                            field.onChange(colorOption);
                            setColor(colorOption);
                          }}
                          role="button"
                          tabIndex={0}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setColor(e.target.value);
                          }}
                          className="w-12 h-8 p-0 border-0"
                        />
                      </FormControl>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full"
                          style={{ backgroundColor: field.value }}
                        />
                        <span className="text-sm">{field.value}</span>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createTagMutation.isPending}>
                {createTagMutation.isPending ? 'Creating...' : 'Create Tag'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}