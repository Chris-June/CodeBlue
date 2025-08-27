import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
import type { UrlCitation } from '@/stores/chatStore';

interface CitationProps {
  citation: UrlCitation;
  index: number;
}

const Citation: React.FC<CitationProps> = ({ citation, index }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <sup className="mx-0.5">
          <Button
            variant="outline"
            size="icon"
            className="w-5 h-5 rounded-full text-xs align-super"
          >
            {index + 1}
          </Button>
        </sup>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Source</h4>
          <p className="text-sm text-muted-foreground">
            {citation.title}
          </p>
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-blue-500 hover:underline"
          >
            <Link className="w-4 h-4 mr-2" />
            Read source
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Citation;
