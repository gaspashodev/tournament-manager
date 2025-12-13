import { useState } from 'react';
import { Plus, X, GripVertical, Trophy, Settings, AlertTriangle, Ban, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Participant, Penalty, ParticipantStatus } from '@/types';

interface ParticipantsListProps {
  participants: Participant[];
  onAdd: (name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onUpdateSeed?: (participantId: string, newSeed: number) => void;
  canAdd?: boolean;
  canRemove?: boolean;
  canEditSeeds?: boolean;
  winnerId?: string;
  penalties?: Penalty[];
  participantStatuses?: ParticipantStatus[];
  onManageParticipant?: (participant: Participant) => void;
  showManagement?: boolean;
  seedingMode?: 'random' | 'manual' | 'ranked';
}

export function ParticipantsList({ 
  participants, 
  onAdd, 
  onRemove, 
  onUpdateSeed,
  canAdd = true,
  canRemove = true,
  canEditSeeds = false,
  winnerId,
  penalties = [],
  participantStatuses = [],
  onManageParticipant,
  showManagement = false,
  seedingMode = 'random'
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

  // Helper pour obtenir les pénalités d'un participant
  const getParticipantPenalties = (participantId: string) => {
    return penalties.filter(p => p.participantId === participantId);
  };

  // Helper pour vérifier si un participant est éliminé
  const isParticipantEliminated = (participantId: string) => {
    const status = participantStatuses.find(s => s.participantId === participantId);
    return status?.isEliminated || false;
  };

  // Déplacer un participant vers le haut (diminuer le seed)
  const moveSeedUp = (participant: Participant) => {
    if (!onUpdateSeed || !participant.seed || participant.seed <= 1) return;
    // Le contexte gère le swap atomique
    onUpdateSeed(participant.id, participant.seed - 1);
  };

  // Déplacer un participant vers le bas (augmenter le seed)
  const moveSeedDown = (participant: Participant) => {
    if (!onUpdateSeed || !participant.seed || participant.seed >= participants.length) return;
    // Le contexte gère le swap atomique
    onUpdateSeed(participant.id, participant.seed + 1);
  };

  // Trier par seed
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.seed !== undefined && b.seed !== undefined) return a.seed - b.seed;
    if (a.seed !== undefined) return -1;
    if (b.seed !== undefined) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Indication du mode de seeding */}
      {seedingMode !== 'random' && canEditSeeds && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
          <span className="font-medium">
            {seedingMode === 'manual' ? 'Seeding manuel' : 'Seeding par classement'}
          </span>
          <span className="text-muted-foreground">• Utilisez les flèches pour réorganiser</span>
        </div>
      )}

      {/* Add participant form */}
      {canAdd && (
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
          sortedParticipants.map((participant, index) => {
            const isEliminated = isParticipantEliminated(participant.id);
            const participantPenalties = getParticipantPenalties(participant.id);
            const totalPenalty = participantPenalties.reduce((sum, p) => sum + p.points, 0);
            
            return (
              <div
                key={participant.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-all",
                  winnerId === participant.id && "border-success bg-success/10",
                  isEliminated && "border-destructive/30 bg-destructive/5 opacity-60"
                )}
              >
                {/* Contrôles de seed (si éditable) */}
                {canEditSeeds && seedingMode !== 'random' && (
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                      onClick={() => moveSeedUp(participant)}
                      disabled={!participant.seed || participant.seed <= 1}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                      onClick={() => moveSeedDown(participant)}
                      disabled={!participant.seed || participant.seed >= participants.length}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {canRemove && seedingMode === 'random' && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                )}
                
                {/* Numéro de seed */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  isEliminated 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-primary/10 text-primary"
                )}>
                  {isEliminated ? <Ban className="h-4 w-4" /> : (participant.seed || index + 1)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "font-medium block truncate",
                    isEliminated && "line-through"
                  )}>
                    {participant.name}
                  </span>
                  {(totalPenalty > 0 || isEliminated) && (
                    <div className="flex items-center gap-2 mt-0.5">
                      {totalPenalty > 0 && (
                        <span className="text-xs text-warning flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          -{totalPenalty} pt{totalPenalty > 1 ? 's' : ''}
                        </span>
                      )}
                      {isEliminated && (
                        <span className="text-xs text-destructive">Éliminé</span>
                      )}
                    </div>
                  )}
                </div>
                
                {winnerId === participant.id && (
                  <div className="flex items-center gap-1 text-success">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">Vainqueur</span>
                  </div>
                )}
                
                {/* Bouton de gestion (pénalités/élimination) */}
                {showManagement && onManageParticipant && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onManageParticipant(participant)}
                    title="Gérer pénalités / élimination"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                
                {canRemove && (
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
            );
          })
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
