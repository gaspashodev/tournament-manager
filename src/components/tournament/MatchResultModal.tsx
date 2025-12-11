import { useState, useEffect } from 'react';
import { X, Trophy, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Match, Participant, ScoreHistory } from '@/types';

interface MatchResultModalProps {
  match: Match;
  participants: Participant[];
  onSubmit: (winnerId: string | undefined, score1: number, score2: number) => void;
  onClose: () => void;
  highScoreWins?: boolean;
}

export function MatchResultModal({ 
  match, 
  participants, 
  onSubmit, 
  onClose,
  highScoreWins = true 
}: MatchResultModalProps) {
  const [score1, setScore1] = useState(match.score?.participant1Score ?? 0);
  const [score2, setScore2] = useState(match.score?.participant2Score ?? 0);
  const [selectedWinner, setSelectedWinner] = useState<string | undefined>(match.winnerId);

  const participant1 = participants.find(p => p.id === match.participant1Id);
  const participant2 = participants.find(p => p.id === match.participant2Id);
  
  const isModification = match.status === 'completed';

  // Auto-select winner based on score and highScoreWins config
  useEffect(() => {
    if (score1 === score2) {
      // En cas d'égalité, permettre la sélection manuelle
      return;
    }
    
    if (highScoreWins) {
      setSelectedWinner(score1 > score2 ? match.participant1Id : match.participant2Id);
    } else {
      setSelectedWinner(score1 < score2 ? match.participant1Id : match.participant2Id);
    }
  }, [score1, score2, highScoreWins, match.participant1Id, match.participant2Id]);

  const handleSubmit = () => {
    onSubmit(selectedWinner, score1, score2);
  };

  // Permettre de soumettre si :
  // - Les scores sont différents (vainqueur auto) OU
  // - Les scores sont égaux avec un vainqueur sélectionné OU  
  // - Les scores sont égaux (match nul accepté)
  const canSubmit = true; // On peut toujours soumettre, le match nul est valide

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
          <h3 className="font-display text-lg font-semibold">
            {isModification ? 'Modifier le résultat' : 'Résultat du match'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Modification warning */}
          {isModification && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Vous modifiez un score existant. L'ancien score sera conservé dans l'historique.</span>
            </div>
          )}
          
          {/* Score history */}
          {match.scoreHistory && match.scoreHistory.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-1">Historique des modifications :</p>
              {match.scoreHistory.map((h: ScoreHistory, i: number) => (
                <p key={i} className="text-muted-foreground">
                  {h.previousScore.participant1Score} - {h.previousScore.participant2Score}
                  <span className="ml-2 text-xs">
                    ({new Date(h.modifiedAt).toLocaleDateString('fr-FR')})
                  </span>
                </p>
              ))}
            </div>
          )}

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
              onClick={() => {
                if (score1 === score2) {
                  // Toggle: si déjà sélectionné, désélectionner
                  setSelectedWinner(prev => prev === match.participant1Id ? undefined : match.participant1Id);
                }
              }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                score1 === score2 ? "cursor-pointer" : "cursor-default",
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
                  onChange={e => setScore1(parseInt(e.target.value) || 0)}
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
              onClick={() => {
                if (score1 === score2) {
                  // Toggle: si déjà sélectionné, désélectionner
                  setSelectedWinner(prev => prev === match.participant2Id ? undefined : match.participant2Id);
                }
              }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                score1 === score2 ? "cursor-pointer" : "cursor-default",
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
                  onChange={e => setScore2(parseInt(e.target.value) || 0)}
                  className="w-20 text-center font-mono text-xl h-12"
                />
              </div>
            </div>
          </div>

          {/* Equal scores warning */}
          {score1 === score2 && (
            <p className="text-sm text-warning text-center">
              {score1 > 0 
                ? "Scores égaux - cliquez sur un joueur pour le désigner vainqueur (recliquez pour annuler)"
                : "Entrez les scores des deux joueurs"
              }
            </p>
          )}
          
          {/* High/Low score indicator */}
          {!highScoreWins && (
            <p className="text-xs text-muted-foreground text-center">
              ⚙️ Le score le plus bas gagne (configuré pour ce tournoi)
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
            disabled={!canSubmit}
            className="flex-1"
          >
            {isModification ? 'Modifier' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
