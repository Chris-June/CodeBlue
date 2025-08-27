/*
  copy-button.tsx
  ----------------
  Small accessible copy-to-clipboard button used in code blocks and anywhere
  text copying is needed.
*/

import React, { useState } from 'react';
import { Button } from './button';

interface CopyButtonProps {
  /** Raw text to copy */
  value: string;
  /** Optional aria-label for screen readers */
  label?: string;
  /** Optional className passthrough */
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, label = 'Copy to clipboard', className }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op: avoid noisy console; UX remains unchanged
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      aria-label={label}
      className={className}
      onClick={onCopy}
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};

export default CopyButton;
