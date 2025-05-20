import React, { useState } from 'react';
import { Tag } from '@shared/schema';
import { TagBadge } from './tag-badge';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Tag as TagIcon, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagSelect: (tagIds: string[]) => void;
  onCreateTag?: () => void;
}

export function TagSelector({ tags, selectedTagIds, onTagSelect, onCreateTag }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const toggleTag = (tagId: string) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagSelect(newSelection);
  };
  
  const selectedTagsCount = selectedTagIds.length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed flex items-center gap-1"
        >
          <TagIcon className="h-3.5 w-3.5" />
          <span>
            {selectedTagsCount === 0
              ? "Add Tags"
              : `${selectedTagsCount} Tag${selectedTagsCount > 1 ? "s" : ""}`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 flex flex-col gap-1">
          <div className="text-sm font-medium px-2 py-1.5">
            Select Tags
          </div>
          {tags.length > 0 ? (
            <ScrollArea className="h-60">
              <div className="p-2 space-y-1">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start font-normal",
                        isSelected && "bg-secondary"
                      )}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <div className="flex items-center w-full">
                        <TagBadge name={tag.name} color={tag.color} />
                        <span className="ml-auto">
                          {isSelected && <Check className="h-4 w-4" />}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tags available
            </div>
          )}
          {onCreateTag && (
            <Button
              onClick={() => {
                setOpen(false);
                onCreateTag();
              }}
              variant="ghost"
              size="sm"
              className="w-full justify-start font-normal mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Tag
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}