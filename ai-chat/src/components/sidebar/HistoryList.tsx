import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore, type ChatSession } from '@/stores/chatStore';
import { useGptsStore } from '@/stores/gptsStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { History, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ConfirmationDialog from '../settings/ConfirmationDialog';

interface HistoryListProps {
  isSidebarOpen: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ isSidebarOpen }) => {
  const { sessions, activeSessionId, setActiveSessionId, renameSession, deleteSession } = useChatStore();
  const { activeGptId, createNewSessionForActiveGpt } = useGptsStore();
  const navigate = useNavigate();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleSelectSession = (session: ChatSession) => {
    if (session.id !== editingSessionId) {
      setActiveSessionId(session.id);
      navigate(`/g/${session.gptId}`);
    }
  };

  const handleRenameClick = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setRenameValue(session.title);
  };

  const handleRenameSubmit = () => {
    if (editingSessionId && renameValue.trim()) {
      renameSession(editingSessionId, renameValue.trim());
    }
    setEditingSessionId(null);
    setRenameValue('');
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete);
    }
    setIsConfirmOpen(false);
    setSessionToDelete(null);
  };

  const filteredSessions = Object.values(sessions).filter((s) => s.gptId === activeGptId);

  if (!isSidebarOpen) {
    return (
      <div className="flex flex-col items-center gap-2 mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="View chat history">
                <History className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>History</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground/90">History</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-sidebar-accent/90 text-sidebar-foreground hover:bg-sidebar-accent border-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={createNewSessionForActiveGpt}
        >
          New Chat
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {filteredSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chat history for this GPT.
          </p>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between rounded-md text-sm w-full ${activeSessionId === session.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/80'}`}
            >
              {editingSessionId === session.id ? (
                <Input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  className="h-8 flex-1 bg-transparent focus:ring-0 focus:ring-offset-0 border-0 focus:border-0 focus:outline-none"
                  autoFocus
                />
              ) : (
                <Button
                  variant='ghost'
                  className="flex-1 justify-start truncate h-8"
                  onClick={() => handleSelectSession(session)}
                >
                  {session.title}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right">
                  <DropdownMenuItem onClick={() => handleRenameClick(session)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteClick(session.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="This will permanently delete this chat session. This action cannot be undone."
      />
    </div>
  );
};

export default HistoryList;
