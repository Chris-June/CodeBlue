import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterCountProps {
  remaining: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
}

const CharacterCount: React.FC<CharacterCountProps> = ({ remaining, isOverLimit, isNearLimit }) => (
  <div className="flex items-center gap-1">
    <span
      className={cn(
        'text-xs px-2 py-1 rounded-full transition-colors font-mono font-medium',
        isOverLimit
          ? 'text-red-500 bg-red-500/10'
          : isNearLimit
          ? 'text-amber-500 bg-amber-500/10'
          : 'text-muted-foreground'
      )}
    >
      {Math.max(0, remaining)}
    </span>
    {isOverLimit && <span className="text-xs text-red-500">Message too long</span>}
  </div>
);

export default CharacterCount;
