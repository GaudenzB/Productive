import React from 'react';
import { Tag } from '@shared/schema';
import { TagBadge } from '@/components/ui/tag-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag as TagIcon, X } from 'lucide-react';

interface TagFilterProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  onCreateTag: () => void;
}

export function TagFilter({
  tags,
  selectedTagId,
  onSelectTag,
  onCreateTag
}: TagFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1">
          <TagIcon className="h-3.5 w-3.5" />
          <span>Filter by Tag</span>
        </h4>
        {selectedTagId && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs" 
            onClick={() => onSelectTag(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {tags.length === 0 ? (
        <div className="p-2 text-center">
          <p className="text-sm text-muted-foreground mb-2">No tags found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={onCreateTag}
          >
            <TagIcon className="h-3.5 w-3.5 mr-1" />
            Create a tag
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-36">
          <div className="space-y-1 p-1">
            <Button
              variant={selectedTagId === null ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start font-normal"
              onClick={() => onSelectTag(null)}
            >
              All tags
            </Button>
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTagId === tag.id ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => onSelectTag(tag.id)}
              >
                <TagBadge name={tag.name} color={tag.color} className="mr-2" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}