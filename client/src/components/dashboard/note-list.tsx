import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/tag-badge";
import { Note, Tag } from "@shared/schema";

interface NoteListProps {
  notes: Note[];
}

export function NoteList({ notes }: NoteListProps) {
  const [, navigate] = useLocation();
  
  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Sort notes by creation date (recent first)
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3); // Limit to 3 notes for the dashboard

  // Get note tags (in a real implementation, we'd fetch the associated tags)
  const getNoteTags = (noteId: string) => {
    if (!tags) return [];
    // In a real implementation, we would fetch tags associated with notes
    // For now, return a few random tags
    return tags.slice(0, Math.floor(Math.random() * 3));
  };

  return (
    <div className="mt-8 mb-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Recent Notes</h2>
        <Button 
          variant="ghost" 
          className="text-primary text-sm font-medium hover:bg-transparent hover:underline"
          onClick={() => navigate('/notes')}
        >
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => (
            <Card 
              key={note.id} 
              className="hover:shadow-md transition-shadow bg-white"
            >
              <CardContent className="p-5">
                <h3 className="font-medium mb-2">{note.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {note.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {getNoteTags(note.id).map((tag) => (
                      <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-1 md:col-span-3 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <p className="text-muted-foreground mb-4">No notes yet</p>
              <Button 
                onClick={() => navigate('/notes')}
                className="text-primary bg-white border border-border hover:bg-secondary/50"
              >
                Create a note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
