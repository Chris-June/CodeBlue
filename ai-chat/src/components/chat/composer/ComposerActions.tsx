import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, RotateCw, X } from 'lucide-react';

interface ComposerActionsProps {
  inputValue: string;
  isGenerating: boolean;
  isSending: boolean;
  isSendDisabled: boolean;
  onClearInput: () => void;
  onStopGenerating: () => void;
}

const ComposerActions: React.FC<ComposerActionsProps> = ({ 
  inputValue, 
  isGenerating, 
  isSending, 
  isSendDisabled, 
  onClearInput, 
  onStopGenerating 
}) => {
  return (
    <div className="flex items-center gap-1">
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClearInput}
          aria-label="Clear message"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {isGenerating ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={onStopGenerating}
          aria-label="Stop generating"
        >
          <div className="h-4 w-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
        </Button>
      ) : (
        <Button 
          type="submit" 
          size="icon" 
          className="h-8 w-8"
          disabled={isSendDisabled}
          aria-label="Send message"
        >
          {isSending ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};

export default ComposerActions;
