import { useState } from 'react';
import { Plus, X, GripVertical, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Participant } from '@/types';

interface ParticipantsListProps {
  participants: Participant[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  winnerId?: string;
}

export function ParticipantsList({ 
  participants, 
  onAdd, 
  onRemove, 
  disabled,
  winnerId
}: ParticipantsListProps) {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add participant form */}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            placeholder="Nom du participant..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      )}

      {/* Participants list */}
      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
            <p className="text-sm">Aucun participant</p>
            <p className="text-xs mt-1">Ajoutez des participants pour commencer</p>
          </div>
        ) : (
          participants.map((participant, index) => (
            <div
              key={participant.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-all",
                winnerId === participant.id && "border-success bg-success/10"
              )}
            >
              {!disabled && (
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              )}
              
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {participant.seed || index + 1}
              </div>
              
              <span className="flex-1 font-medium">{participant.name}</span>
              
              {winnerId === participant.id && (
                <div className="flex items-center gap-1 text-success">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">Vainqueur</span>
                </div>
              )}
              
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(participant.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground text-center">
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
        {participants.length > 0 && participants.length < 2 && (
          <span className="text-warning ml-2">
            (minimum 2 requis)
          </span>
        )}
      </div>
    </div>
  );
}
