import { useState } from 'react';
import { X, Trophy, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Match, Participant } from '@/types';

interface MatchResultModalProps {
  match: Match;
  participants: Participant[];
  onSubmit: (winnerId: string, score1: number, score2: number) => void;
  onClose: () => void;
}

export function MatchResultModal({ match, participants, onSubmit, onClose }: MatchResultModalProps) {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const participant1 = participants.find(p => p.id === match.participant1Id);
  const participant2 = participants.find(p => p.id === match.participant2Id);

  const handleSubmit = () => {
    if (!selectedWinner) return;
    onSubmit(selectedWinner, score1, score2);
  };

  // Auto-select winner based on score
  const handleScoreChange = (isP1: boolean, value: number) => {
    if (isP1) {
      setScore1(value);
      if (value > score2) setSelectedWinner(match.participant1Id!);
      else if (value < score2) setSelectedWinner(match.participant2Id!);
    } else {
      setScore2(value);
      if (score1 > value) setSelectedWinner(match.participant1Id!);
      else if (score1 < value) setSelectedWinner(match.participant2Id!);
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
          <h3 className="font-display text-lg font-semibold">Résultat du match</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timer integration hint */}
          {match.timerRoomCode && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
              <Timer className="h-4 w-4" />
              <span>Room timer: {match.timerRoomCode}</span>
            </div>
          )}

          {/* Participants and scores */}
          <div className="space-y-4">
            {/* Participant 1 */}
            <div 
              onClick={() => setSelectedWinner(match.participant1Id!)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                selectedWinner === match.participant1Id 
                  ? "border-success bg-success/10"
                  : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {participant1?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{participant1?.name}</p>
                {selectedWinner === match.participant1Id && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <Trophy className="h-3 w-3" />
                    Vainqueur
                  </div>
                )}
              </div>
              <div>
                <Label className="sr-only">Score {participant1?.name}</Label>
                <Input
                  type="number"
                  min="0"
                  value={score1}
                  onChange={e => handleScoreChange(true, parseInt(e.target.value) || 0)}
                  className="w-20 text-center font-mono text-xl h-12"
                />
              </div>
            </div>

            {/* VS separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">VS</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Participant 2 */}
            <div 
              onClick={() => setSelectedWinner(match.participant2Id!)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                selectedWinner === match.participant2Id 
                  ? "border-success bg-success/10"
                  : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {participant2?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{participant2?.name}</p>
                {selectedWinner === match.participant2Id && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <Trophy className="h-3 w-3" />
                    Vainqueur
                  </div>
                )}
              </div>
              <div>
                <Label className="sr-only">Score {participant2?.name}</Label>
                <Input
                  type="number"
                  min="0"
                  value={score2}
                  onChange={e => handleScoreChange(false, parseInt(e.target.value) || 0)}
                  className="w-20 text-center font-mono text-xl h-12"
                />
              </div>
            </div>
          </div>

          {/* Equal scores warning */}
          {score1 === score2 && score1 > 0 && (
            <p className="text-sm text-warning text-center">
              Scores égaux - sélectionnez manuellement le vainqueur
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedWinner}
            className="flex-1"
          >
            Confirmer le résultat
          </Button>
        </div>
      </div>
    </div>
  );
}
