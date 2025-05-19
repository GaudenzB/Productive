import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductivityStreakProps {
  streak: number;
}

export function ProductivityStreak({ streak }: ProductivityStreakProps) {
  // Display 10 days in the streak view
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
  
  return (
    <Card className="bg-white mb-8">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Productivity Streak</h2>
          <span className="text-primary font-medium">{streak} Days</span>
        </div>
        <div className="flex justify-between space-x-2">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "flex-1 h-2 rounded",
                index < streak ? "bg-success" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {days.map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
