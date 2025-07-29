import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGptsStore, type Gpt } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, Pencil } from 'lucide-react';
import ConfirmationDialog from '../settings/ConfirmationDialog';

interface GptListProps {
  isSidebarOpen: boolean;
}

const GptList: React.FC<GptListProps> = ({ isSidebarOpen }) => {
  const { gpts, activeGptId, setActiveGptId, deleteGpt } = useGptsStore();
  const navigate = useNavigate();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gptToDelete, setGptToDelete] = useState<Gpt | null>(null);

  const handleSelectGpt = (id: string) => {
    setActiveGptId(id);
    navigate(`/g/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, gptId: string) => {
    e.stopPropagation();
    navigate(`/g/edit/${gptId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, gpt: Gpt) => {
    e.stopPropagation(); // Prevent selecting the GPT
    setGptToDelete(gpt);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (gptToDelete) {
      deleteGpt(gptToDelete.id);
      setGptToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  if (!isSidebarOpen) {
    return (
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => navigate('/g/new')} aria-label="Create new GPT">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New GPT</p>
            </TooltipContent>
          </Tooltip>
          {gpts.map((gpt: Gpt) => (
            <Tooltip key={gpt.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeGptId === gpt.id ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => handleSelectGpt(gpt.id)}
                  aria-label={gpt.name}
                >
                  {gpt.avatar}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{gpt.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">GPTs</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/g/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New GPT
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {gpts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No GPTs created yet.</p>
        ) : (
          gpts.map((gpt: Gpt) => (
            <div key={gpt.id} className="group relative w-full">
              <Button
                variant={activeGptId === gpt.id ? 'secondary' : 'ghost'}
                onClick={() => handleSelectGpt(gpt.id)}
                className="w-full justify-start h-auto p-2 text-left"
              >
                <div className="flex items-center gap-2 flex-grow">
                  <span className="text-base">{gpt.avatar}</span>
                  <span className="text-sm font-medium truncate">{gpt.name}</span>
                </div>
              </Button>
              {gpt.id !== 'gpt-default' && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleEditClick(e, gpt.id)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit GPT</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Edit {gpt.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => handleDeleteClick(e, gpt)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete GPT</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Delete {gpt.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {gptToDelete && (
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          onConfirm={handleConfirmDelete}
          title={`Delete "${gptToDelete.name}"?`}
          description="This will permanently delete this GPT and all of its chat history. This action cannot be undone."
        />
      )}
    </div>
  );
};

export default GptList;
