import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagBadge } from "@/components/ui/tag-badge";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InsertNote, Note, Tag } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Filter, Search } from "lucide-react";

// Note form schema
const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export default function Notes() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { toast } = useToast();
  
  // Queries
  const { data: notes, isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });
  
  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });
  
  // Form
  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });
  
  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertNote) => {
      const res = await apiRequest("POST", "/api/notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Note> }) => {
      const res = await apiRequest("PATCH", `/api/notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setSelectedNote(null);
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setSelectedNote(null);
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const onCreateSubmit = (data: z.infer<typeof noteFormSchema>) => {
    createNoteMutation.mutate(data as InsertNote);
  };
  
  const onUpdateSubmit = (data: z.infer<typeof noteFormSchema>) => {
    if (selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, data });
    }
  };
  
  const onNoteSelect = (note: Note) => {
    setSelectedNote(note);
    form.reset({
      title: note.title,
      content: note.content,
    });
  };
  
  const resetForm = () => {
    form.reset({
      title: "",
      content: "",
    });
    setSelectedNote(null);
  };
  
  // Get note tags
  const getNoteTags = (noteId: string) => {
    if (!tags) return [];
    // In a real implementation, we would fetch tags associated with notes
    // For now, just return a placeholder
    return tags.slice(0, 2);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Notes</h1>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search notes..." className="pl-8" />
              </div>
              
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" /> New Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Note title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your note here..." 
                                className="min-h-[200px]"
                                {...field} 
                              />
                            </FormControl>
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
                          disabled={createNoteMutation.isPending}
                        >
                          {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingNotes ? (
              // Loading state
              <div className="text-center py-10 col-span-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading notes...</p>
              </div>
            ) : notes && notes.length > 0 ? (
              // Note cards
              notes.map((note) => (
                <Card 
                  key={note.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <h3 className="font-medium text-base mb-2">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {note.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {getNoteTags(note.id).map((tag) => (
                          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex mt-4 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onNoteSelect(note)}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Edit Note</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Note title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Write your note here..." 
                                        className="min-h-[300px]"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-between">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => deleteNoteMutation.mutate(selectedNote!.id)}
                                  disabled={deleteNoteMutation.isPending}
                                >
                                  {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
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
                                    disabled={updateNoteMutation.isPending}
                                  >
                                    {updateNoteMutation.isPending ? "Saving..." : "Save Changes"}
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
                    <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first note to get started</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> New Note
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
