/*
  CodeBlock.tsx
  -------------
  Code block renderer with language label and copy-to-clipboard action.
*/

import React from 'react';
import CopyButton from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  /** Raw code content */
  value: string;
  /** className from markdown renderer, e.g. `language-ts` */
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ value, className }) => {
  const langMatch = /language-([\w-]+)/.exec(className || '');
  const language = langMatch?.[1]?.toUpperCase();

  return (
    <div className="relative group/code rounded-lg border border-border/50 bg-muted/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground border-b border-border/50 bg-background/40 backdrop-blur">
        <span className="font-medium tracking-wide select-none">{language || 'CODE'}</span>
        <CopyButton value={value} className="h-6 px-2 text-xs" />
      </div>
      {/* Body */}
      <pre className={cn('p-3 overflow-x-auto text-foreground', className)}>
        <code>{value}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
