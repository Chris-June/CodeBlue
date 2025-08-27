import React from 'react';
import { Bold, Italic, Code, List, ListOrdered, Link, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarkdownToolbarProps {
  onInsert: (markdown: string) => void;
  isDisabled?: boolean;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onInsert, isDisabled = false }) => {
  const handleClick = (markdown: string) => {
    onInsert(markdown);
  };

  const buttons = [
    { name: 'Bold', icon: <Bold className="h-4 w-4" />, markdown: '**bold**' },
    { name: 'Italic', icon: <Italic className="h-4 w-4" />, markdown: '_italic_' },
    { name: 'Code', icon: <Code className="h-4 w-4" />, markdown: '`code`' },
    { name: 'Bullet List', icon: <List className="h-4 w-4" />, markdown: '- List item' },
    { name: 'Numbered List', icon: <ListOrdered className="h-4 w-4" />, markdown: '1. First item' },
    { name: 'Link', icon: <Link className="h-4 w-4" />, markdown: '[text](url)' },
    { name: 'Image', icon: <Image className="h-4 w-4" />, markdown: '![alt](image-url)' },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/50">
      <TooltipProvider>
        {buttons.map((button) => (
          <Tooltip key={button.name}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleClick(button.markdown)}
                disabled={isDisabled}
                aria-label={button.name}
              >
                {button.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{button.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default MarkdownToolbar;
