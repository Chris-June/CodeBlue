import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chatStore';
import { Sparkles } from 'lucide-react';

interface SmartPromptsProps {
  prompts: string[];
}

const SmartPrompts: React.FC<SmartPromptsProps> = ({ prompts }) => {
  const { sendMessage, isGenerating } = useChatStore();

  const handlePromptClick = (prompt: string) => {
    if (isGenerating) return;
    sendMessage(prompt);
  };

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="mt-4 ml-11"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-yellow-400" />
        <h4 className="text-sm font-semibold text-muted-foreground">Suggested Prompts</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-sm h-auto py-1.5"
            onClick={() => handlePromptClick(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

export default SmartPrompts;
