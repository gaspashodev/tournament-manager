import { useState } from 'react';
import { X, Trophy, Crown, Equal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Participant, GroupStanding } from '@/types';

interface WinnerSelectionModalProps {
  participants: Participant[];
  standings?: GroupStanding[];
  onSelect: (winnerId: string) => void;
  onClose: () => void;
}

// Helper pour obtenir les joueurs à égalité parfaite
function getTiedParticipantIds(standings?: GroupStanding[]): string[] {
  if (!standings || standings.length < 2) return standings?.map(s => s.participantId) || [];
  
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
  
  const first = sorted[0];
  const firstDiff = first.pointsFor - first.pointsAgainst;
  
  // Trouver tous les joueurs avec les mêmes stats que le premier
  return sorted
    .filter(s => {
      const diff = s.pointsFor - s.pointsAgainst;
      return s.points === first.points && diff === firstDiff && s.pointsFor === first.pointsFor;
    })
    .map(s => s.participantId);
}

export function WinnerSelectionModal({ 
  participants, 
  standings,
  onSelect, 
  onClose 
}: WinnerSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Obtenir uniquement les IDs des joueurs à égalité
  const tiedParticipantIds = getTiedParticipantIds(standings);
  
  // Filtrer pour n'avoir que les joueurs à égalité
  const tiedParticipants = participants.filter(p => tiedParticipantIds.includes(p.id));

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-card border shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <h3 className="font-display text-lg font-semibold">Désigner le vainqueur</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
            <Equal className="h-4 w-4" />
            <p className="text-sm font-medium">
              {tiedParticipants.length} joueurs à égalité parfaite
            </p>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Ces joueurs ont exactement les mêmes statistiques. Sélectionnez le vainqueur du tournoi.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tiedParticipants.map((participant) => {
              const standing = standings?.find(s => s.participantId === participant.id);
              
              return (
                <div
                  key={participant.id}
                  onClick={() => setSelectedId(participant.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    selectedId === participant.id
                      ? "border-success bg-success/10"
                      : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning text-lg font-semibold">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{participant.name}</p>
                    {standing && (
                      <p className="text-xs text-muted-foreground">
                        {standing.points} pts • {standing.won}V {standing.drawn}N {standing.lost}D • Diff: {standing.pointsFor - standing.pointsAgainst}
                      </p>
                    )}
                  </div>
                  
                  {selectedId === participant.id && (
                    <Trophy className="h-5 w-5 text-success" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex-1"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Confirmer le vainqueur
          </Button>
        </div>
      </div>
    </div>
  );
}
