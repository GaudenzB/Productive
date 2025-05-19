import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, differenceInMinutes } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InsertMeeting, Meeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Filter, CalendarIcon, Clock, ClockIcon } from "lucide-react";

// Meeting form schema
const meetingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.date({ required_error: "Start time is required" }),
  endTime: z.date({ required_error: "End time is required" }),
}).refine(data => {
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export default function Meetings() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const { toast } = useToast();
  
  // Queries
  const { data: meetings, isLoading: isLoadingMeetings } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });
  
  // Form
  const form = useForm<z.infer<typeof meetingFormSchema>>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    },
  });
  
  // Mutations
  const createMeetingMutation = useMutation({
    mutationFn: async (data: InsertMeeting) => {
      const res = await apiRequest("POST", "/api/meetings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Meeting scheduled",
        description: "Your meeting has been scheduled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to schedule meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meeting> }) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setSelectedMeeting(null);
      toast({
        title: "Meeting updated",
        description: "Your meeting has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setSelectedMeeting(null);
      toast({
        title: "Meeting deleted",
        description: "Your meeting has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete meeting",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const onCreateSubmit = (data: z.infer<typeof meetingFormSchema>) => {
    const duration = differenceInMinutes(data.endTime, data.startTime);
    
    createMeetingMutation.mutate({
      ...data,
      duration,
    } as InsertMeeting);
  };
  
  const onUpdateSubmit = (data: z.infer<typeof meetingFormSchema>) => {
    if (selectedMeeting) {
      const duration = differenceInMinutes(data.endTime, data.startTime);
      
      updateMeetingMutation.mutate({ 
        id: selectedMeeting.id, 
        data: {
          ...data,
          duration,
        }
      });
    }
  };
  
  const onMeetingSelect = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    form.reset({
      title: meeting.title,
      description: meeting.description || "",
      startTime: new Date(meeting.startTime),
      endTime: new Date(meeting.endTime),
    });
  };
  
  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    });
    setSelectedMeeting(null);
  };
  
  // Group meetings by date
  const groupMeetingsByDate = () => {
    if (!meetings) return {};
    
    return meetings.reduce((acc, meeting) => {
      const date = format(new Date(meeting.startTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(meeting);
      return acc;
    }, {} as Record<string, Meeting[]>);
  };
  
  const groupedMeetings = groupMeetingsByDate();
  const sortedDates = Object.keys(groupedMeetings).sort();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Meetings</h1>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button variant="outline" className="gap-1">
                <CalendarIcon className="h-4 w-4" /> Calendar View
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" /> Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Meeting</DialogTitle>
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
                              <Input placeholder="Meeting title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Meeting details" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP HH:mm")
                                      ) : (
                                        <span>Select date & time</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const newDate = new Date(date);
                                        newDate.setHours(field.value.getHours());
                                        newDate.setMinutes(field.value.getMinutes());
                                        field.onChange(newDate);
                                      }
                                    }}
                                    initialFocus
                                  />
                                  <div className="p-3 border-t border-border">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="time"
                                        value={format(field.value, "HH:mm")}
                                        onChange={(e) => {
                                          const [hours, minutes] = e.target.value.split(':');
                                          const newDate = new Date(field.value);
                                          newDate.setHours(parseInt(hours));
                                          newDate.setMinutes(parseInt(minutes));
                                          field.onChange(newDate);
                                        }}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP HH:mm")
                                      ) : (
                                        <span>Select date & time</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const newDate = new Date(date);
                                        newDate.setHours(field.value.getHours());
                                        newDate.setMinutes(field.value.getMinutes());
                                        field.onChange(newDate);
                                      }
                                    }}
                                    initialFocus
                                  />
                                  <div className="p-3 border-t border-border">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="time"
                                        value={format(field.value, "HH:mm")}
                                        onChange={(e) => {
                                          const [hours, minutes] = e.target.value.split(':');
                                          const newDate = new Date(field.value);
                                          newDate.setHours(parseInt(hours));
                                          newDate.setMinutes(parseInt(minutes));
                                          field.onChange(newDate);
                                        }}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                          disabled={createMeetingMutation.isPending}
                        >
                          {createMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Meetings List */}
          {isLoadingMeetings ? (
            // Loading state
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading meetings...</p>
            </div>
          ) : meetings && meetings.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <h2 className="text-lg font-medium mb-3">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h2>
                  <div className="space-y-3">
                    {groupedMeetings[date]
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map(meeting => (
                        <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium text-base">{meeting.title}</h3>
                                {meeting.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {meeting.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" />
                                    {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                                  </div>
                                  <div className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                                    {meeting.duration} min
                                  </div>
                                </div>
                              </div>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => onMeetingSelect(meeting)}
                                  >
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Meeting</DialogTitle>
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
                                              <Input placeholder="Meeting title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                              <Textarea placeholder="Meeting details" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="startTime"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>Start Time</FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(field.value, "PPP HH:mm")
                                                      ) : (
                                                        <span>Select date & time</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                      if (date) {
                                                        const newDate = new Date(date);
                                                        newDate.setHours(field.value.getHours());
                                                        newDate.setMinutes(field.value.getMinutes());
                                                        field.onChange(newDate);
                                                      }
                                                    }}
                                                    initialFocus
                                                  />
                                                  <div className="p-3 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                      <Input
                                                        type="time"
                                                        value={format(field.value, "HH:mm")}
                                                        onChange={(e) => {
                                                          const [hours, minutes] = e.target.value.split(':');
                                                          const newDate = new Date(field.value);
                                                          newDate.setHours(parseInt(hours));
                                                          newDate.setMinutes(parseInt(minutes));
                                                          field.onChange(newDate);
                                                        }}
                                                        className="w-full"
                                                      />
                                                    </div>
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name="endTime"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>End Time</FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(field.value, "PPP HH:mm")
                                                      ) : (
                                                        <span>Select date & time</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                      if (date) {
                                                        const newDate = new Date(date);
                                                        newDate.setHours(field.value.getHours());
                                                        newDate.setMinutes(field.value.getMinutes());
                                                        field.onChange(newDate);
                                                      }
                                                    }}
                                                    initialFocus
                                                  />
                                                  <div className="p-3 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                      <Input
                                                        type="time"
                                                        value={format(field.value, "HH:mm")}
                                                        onChange={(e) => {
                                                          const [hours, minutes] = e.target.value.split(':');
                                                          const newDate = new Date(field.value);
                                                          newDate.setHours(parseInt(hours));
                                                          newDate.setMinutes(parseInt(minutes));
                                                          field.onChange(newDate);
                                                        }}
                                                        className="w-full"
                                                      />
                                                    </div>
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      <div className="flex justify-between">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          onClick={() => deleteMeetingMutation.mutate(selectedMeeting!.id)}
                                          disabled={deleteMeetingMutation.isPending}
                                        >
                                          {deleteMeetingMutation.isPending ? "Deleting..." : "Delete"}
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
                                            disabled={updateMeetingMutation.isPending}
                                          >
                                            {updateMeetingMutation.isPending ? "Saving..." : "Save Changes"}
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
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state
            <Card className="text-center py-10">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">No meetings scheduled</h3>
                <p className="text-muted-foreground mb-4">Schedule your first meeting to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
