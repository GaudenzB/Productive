import React from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Meeting } from "@shared/schema";
import { Plus, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MeetingListProps {
  meetings: Meeting[];
  isLoading?: boolean;
}

export function MeetingList({ meetings, isLoading = false }: MeetingListProps) {
  const [, navigate] = useLocation();

  // Filter upcoming meetings and sort by start time
  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3); // Limit to 3 meetings for the dashboard

  return (
    <Card className="bg-white">
      <div className="flex justify-between items-center p-5 pb-0">
        <h2 className="text-lg font-bold">Upcoming Meetings</h2>
        <Button 
          variant="ghost" 
          className="text-primary text-sm font-medium hover:bg-transparent hover:underline"
          onClick={() => navigate('/meetings')}
        >
          View All
        </Button>
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 2 }).map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="p-4 border-l-4 border-primary/30 bg-secondary rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-1" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4 mt-2" />
              </div>
            ))
          ) : upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="p-4 border-l-4 border-primary bg-secondary rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium mb-1">{meeting.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(meeting.startTime), "EEE, MMM d, h:mm a")} - {format(new Date(meeting.endTime), "h:mm a")}
                    </p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {meeting.duration} min
                  </span>
                </div>
                {meeting.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    {meeting.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No upcoming meetings
            </div>
          )}
        </div>
        
        <Button 
          className="mt-4 w-full flex items-center justify-center p-2 bg-white border border-border rounded-lg text-primary font-medium hover:bg-secondary/50"
          variant="ghost"
          onClick={() => navigate('/meetings')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Schedule Meeting
        </Button>
      </CardContent>
    </Card>
  );
}
