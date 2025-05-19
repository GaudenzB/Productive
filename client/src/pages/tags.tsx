import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InsertTag, Tag } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash } from "lucide-react";

// Tag form schema
const tagFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Color must be a valid hex code (e.g. #FF5733)",
  }),
});

export default function Tags() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const { toast } = useToast();

  // Queries
  const { data: tags, isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Form
  const form = useForm<z.infer<typeof tagFormSchema>>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      color: "#CCCCCC",
    },
  });

  // Mutations
  const createTagMutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      const res = await apiRequest("POST", "/api/tags", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Tag created",
        description: "Your tag has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tag> }) => {
      const res = await apiRequest("PATCH", `/api/tags/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setSelectedTag(null);
      toast({
        title: "Tag updated",
        description: "Your tag has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setSelectedTag(null);
      toast({
        title: "Tag deleted",
        description: "Your tag has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onCreateSubmit = (data: z.infer<typeof tagFormSchema>) => {
    createTagMutation.mutate(data as InsertTag);
  };

  const onUpdateSubmit = (data: z.infer<typeof tagFormSchema>) => {
    if (selectedTag) {
      updateTagMutation.mutate({ id: selectedTag.id, data });
    }
  };

  const onTagSelect = (tag: Tag) => {
    setSelectedTag(tag);
    form.reset({
      name: tag.name,
      color: tag.color,
    });
  };

  const resetForm = () => {
    form.reset({
      name: "",
      color: "#CCCCCC",
    });
    setSelectedTag(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Tags</h1>
            
            <div className="mt-4 md:mt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" /> New Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Tag name" {...field} />
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
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="text" placeholder="#CCCCCC" {...field} />
                              </FormControl>
                              <Input
                                type="color"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-9 p-1"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTagMutation.isPending}
                        >
                          {createTagMutation.isPending ? "Creating..." : "Create Tag"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingTags ? (
              // Loading state
              <div className="text-center py-10 col-span-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading tags...</p>
              </div>
            ) : tags && tags.length > 0 ? (
              // Tag cards
              tags.map((tag) => (
                <Card 
                  key={tag.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onTagSelect(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Tag</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Tag name" {...field} />
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
                                    <div className="flex gap-2">
                                      <FormControl>
                                        <Input type="text" placeholder="#CCCCCC" {...field} />
                                      </FormControl>
                                      <Input
                                        type="color"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        className="w-12 h-9 p-1"
                                      />
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-between">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => deleteTagMutation.mutate(selectedTag!.id)}
                                  disabled={deleteTagMutation.isPending}
                                  className="gap-1"
                                >
                                  <Trash className="h-4 w-4" />
                                  {deleteTagMutation.isPending ? "Deleting..." : "Delete"}
                                </Button>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={resetForm}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={updateTagMutation.isPending}
                                  >
                                    {updateTagMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Empty state
              <div className="col-span-3">
                <Card className="text-center py-10">
                  <CardContent>
                    <h3 className="text-lg font-medium mb-2">No tags yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first tag to organize your tasks and notes</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> New Tag
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
