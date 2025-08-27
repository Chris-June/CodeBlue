import React from 'react';
import type { Gpt } from '@/stores/gptsStore';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModelInfoProps {
  gpt: Gpt | null;
  className?: string;
}

const ModelInfo: React.FC<ModelInfoProps> = ({ gpt, className = '' }) => {
  if (!gpt) return null;

  const getModelBadge = (modelName: string) => {
    const modelMap: Record<string, { name: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'gpt-4o': { name: 'GPT-4o', variant: 'default' },
      'gpt-4-turbo': { name: 'GPT-4 Turbo', variant: 'secondary' },
      'gpt-4': { name: 'GPT-4', variant: 'outline' },
      'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', variant: 'outline' },
    };

    return modelMap[modelName] || { name: modelName, variant: 'outline' as const };
  };

    const modelInfo = getModelBadge(gpt.model || 'gpt-4o');

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Badge variant={modelInfo.variant} className="font-mono text-xs">
        {modelInfo.name}
      </Badge>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              type="button" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Model information"
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-4 space-y-2">
            <h4 className="font-semibold">{modelInfo.name} Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground">Temperature</div>
                <div>{gpt.temperature.toFixed(1)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Top P</div>
                <div>{gpt.topP.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Frequency Penalty</div>
                <div>{gpt.frequencyPenalty.toFixed(1)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Max Tokens</div>
                <div>{gpt.maxTokens}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Adjust these settings in the GPT editor for custom behavior.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModelInfo;
