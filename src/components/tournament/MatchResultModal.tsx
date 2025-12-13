import { useState, useEffect, useMemo } from 'react';
import { X, Trophy, Timer, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Match, Participant, Game } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface MatchResultModalProps {
  match: Match;
  participants: Participant[];
  onSubmit: (result: {
    winnerId: string | undefined;
    score1: number;
    score2: number;
    games: Game[];
    isPartial?: boolean; // Match en cours (pas encore terminé)
  }) => void;
  onClose: () => void;
  highScoreWins?: boolean;
  bestOf?: number;
}

export function MatchResultModal({ 
  match, 
  participants, 
  onSubmit, 
  onClose,
  highScoreWins = true,
  bestOf = 1
}: MatchResultModalProps) {
  // Initialiser les manches depuis le match existant ou vide
  const [games, setGames] = useState<Game[]>(match.games || []);
  const [newGameScore1, setNewGameScore1] = useState(0);
  const [newGameScore2, setNewGameScore2] = useState(0);

  const participant1 = participants.find(p => p.id === match.participant1Id);
  const participant2 = participants.find(p => p.id === match.participant2Id);
  
  const isModification = match.status === 'completed' || (match.games && match.games.length > 0);
  const isBestOfMode = bestOf > 1;
  const winsNeeded = Math.ceil(bestOf / 2);

  // Calculer les victoires de chaque joueur
  const { p1Wins, p2Wins } = useMemo(() => {
    let p1 = 0, p2 = 0;
    games.forEach(g => {
      if (g.winnerId === match.participant1Id) p1++;
      else if (g.winnerId === match.participant2Id) p2++;
    });
    return { p1Wins: p1, p2Wins: p2 };
  }, [games, match.participant1Id, match.participant2Id]);

  // Déterminer le vainqueur du match (BO)
  const matchWinnerId = useMemo(() => {
    if (isBestOfMode) {
      if (p1Wins >= winsNeeded) return match.participant1Id;
      if (p2Wins >= winsNeeded) return match.participant2Id;
      return undefined;
    } else {
      // Mode simple : une seule manche ou score direct
      if (games.length === 1) return games[0].winnerId;
      return undefined;
    }
  }, [p1Wins, p2Wins, winsNeeded, isBestOfMode, games, match.participant1Id, match.participant2Id]);

  // Vérifier si le match est terminé
  const isMatchComplete = !!matchWinnerId;

  // Ajouter une manche
  const addGame = () => {
    if (isMatchComplete) return;
    
    // Déterminer le vainqueur de la manche
    let gameWinnerId: string | undefined;
    if (newGameScore1 !== newGameScore2) {
      if (highScoreWins) {
        gameWinnerId = newGameScore1 > newGameScore2 ? match.participant1Id : match.participant2Id;
      } else {
        gameWinnerId = newGameScore1 < newGameScore2 ? match.participant1Id : match.participant2Id;
      }
    }

    const newGame: Game = {
      id: uuidv4(),
      gameNumber: games.length + 1,
      participant1Score: newGameScore1,
      participant2Score: newGameScore2,
      winnerId: gameWinnerId,
      completedAt: new Date()
    };

    setGames([...games, newGame]);
    setNewGameScore1(0);
    setNewGameScore2(0);
  };

  // Supprimer une manche
  const removeGame = (gameId: string) => {
    setGames(games.filter(g => g.id !== gameId).map((g, i) => ({ ...g, gameNumber: i + 1 })));
  };

  // Soumettre le résultat (complet ou partiel)
  const handleSubmit = (partial: boolean = false) => {
    // Calculer le score global (nombre de manches gagnées)
    const score1 = p1Wins;
    const score2 = p2Wins;
    
    onSubmit({
      winnerId: isMatchComplete ? matchWinnerId : undefined,
      score1,
      score2,
      games,
      isPartial: partial && !isMatchComplete
    });
  };

  // Mode simple (BO1) : utiliser directement les scores
  const handleSimpleSubmit = () => {
    let winnerId: string | undefined;
    if (newGameScore1 !== newGameScore2) {
      if (highScoreWins) {
        winnerId = newGameScore1 > newGameScore2 ? match.participant1Id : match.participant2Id;
      } else {
        winnerId = newGameScore1 < newGameScore2 ? match.participant1Id : match.participant2Id;
      }
    }
    
    onSubmit({
      winnerId,
      score1: newGameScore1,
      score2: newGameScore2,
      games: [{
        id: uuidv4(),
        gameNumber: 1,
        participant1Score: newGameScore1,
        participant2Score: newGameScore2,
        winnerId,
        completedAt: new Date()
      }]
    });
  };

  // Initialiser les scores pour le mode simple
  useEffect(() => {
    if (!isBestOfMode && match.score) {
      setNewGameScore1(match.score.participant1Score);
      setNewGameScore2(match.score.participant2Score);
    }
  }, [isBestOfMode, match.score]);

  // Peut-on ajouter une manche ?
  const canAddGame = !isMatchComplete && (newGameScore1 !== newGameScore2 || !highScoreWins);
  
  // Peut-on sauvegarder ? (au moins une manche jouée)
  const canSave = games.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-card border shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="font-display text-lg font-semibold">
            {isModification ? 'Modifier le résultat' : 'Résultat du match'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Mode Best-of : affichage complet */}
          {isBestOfMode && (
            <>
              {/* Best-of indicator */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary font-medium">
                <span className="text-lg">Best of {bestOf}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Premier à {winsNeeded} victoire{winsNeeded > 1 ? 's' : ''}</span>
              </div>

              {/* Participants header with current score */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                    matchWinnerId === match.participant1Id ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {participant1?.seed || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      matchWinnerId === match.participant1Id && "text-success"
                    )}>
                      {participant1?.name}
                    </p>
                    {matchWinnerId === match.participant1Id && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> Vainqueur
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Score global */}
                <div className="flex items-center gap-2 px-4">
                  <span className={cn(
                    "text-3xl font-bold font-mono",
                    matchWinnerId === match.participant1Id && "text-success"
                  )}>
                    {p1Wins}
                  </span>
                  <span className="text-xl text-muted-foreground">-</span>
                  <span className={cn(
                    "text-3xl font-bold font-mono",
                    matchWinnerId === match.participant2Id && "text-success"
                  )}>
                    {p2Wins}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="flex-1 min-w-0 text-right">
                    <p className={cn(
                      "font-medium truncate",
                      matchWinnerId === match.participant2Id && "text-success"
                    )}>
                      {participant2?.name}
                    </p>
                    {matchWinnerId === match.participant2Id && (
                      <span className="text-xs text-success flex items-center gap-1 justify-end">
                        <Trophy className="h-3 w-3" /> Vainqueur
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                    matchWinnerId === match.participant2Id ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {participant2?.seed || '?'}
                  </div>
                </div>
              </div>

              {/* Liste des manches jouées */}
              {games.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Manches jouées</Label>
                  <div className="space-y-2">
                    {games.map((game) => (
                      <div 
                        key={game.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          game.winnerId === match.participant1Id && "border-l-4 border-l-success",
                          game.winnerId === match.participant2Id && "border-r-4 border-r-success"
                        )}
                      >
                        <span className="text-sm text-muted-foreground w-20">
                          Manche {game.gameNumber}
                        </span>
                        <div className="flex-1 flex items-center justify-center gap-4">
                          <span className={cn(
                            "font-mono text-lg font-medium w-8 text-center",
                            game.winnerId === match.participant1Id && "text-success"
                          )}>
                            {game.participant1Score}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className={cn(
                            "font-mono text-lg font-medium w-8 text-center",
                            game.winnerId === match.participant2Id && "text-success"
                          )}>
                            {game.participant2Score}
                          </span>
                        </div>
                        {!isMatchComplete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeGame(game.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {game.winnerId && (
                          <Check className="h-4 w-4 text-success" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ajouter une manche */}
              {!isMatchComplete && (
                <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30">
                  <Label className="text-sm font-medium">
                    Ajouter manche {games.length + 1}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{participant1?.name}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newGameScore1}
                        onChange={e => setNewGameScore1(parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{participant2?.name}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newGameScore2}
                        onChange={e => setNewGameScore2(parseInt(e.target.value) || 0)}
                        className="text-center font-mono text-lg"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addGame}
                    disabled={!canAddGame}
                    className="w-full mt-3"
                    variant="secondary"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Valider la manche {games.length + 1}
                  </Button>
                  {newGameScore1 === newGameScore2 && newGameScore1 > 0 && (
                    <p className="text-xs text-warning">Les scores ne peuvent pas être égaux pour une manche</p>
                  )}
                </div>
              )}

              {/* Match terminé */}
              {isMatchComplete && (
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10 text-success">
                  <Trophy className="h-5 w-5" />
                  <span className="font-medium">
                    {matchWinnerId === match.participant1Id ? participant1?.name : participant2?.name} remporte le match {p1Wins}-{p2Wins}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Mode simple (BO1) - Interface simplifiée */}
          {!isBestOfMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {participant1?.seed || '?'}
                    </div>
                    <Label className="font-medium">{participant1?.name}</Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={newGameScore1}
                    onChange={e => setNewGameScore1(parseInt(e.target.value) || 0)}
                    className="text-center font-mono text-2xl h-14"
                  />
                </div>
                <span className="text-xl text-muted-foreground font-medium mt-8">VS</span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Label className="font-medium">{participant2?.name}</Label>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {participant2?.seed || '?'}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={newGameScore2}
                    onChange={e => setNewGameScore2(parseInt(e.target.value) || 0)}
                    className="text-center font-mono text-2xl h-14"
                  />
                </div>
              </div>
              
              {newGameScore1 === newGameScore2 && newGameScore1 > 0 && (
                <p className="text-sm text-warning text-center">
                  Scores égaux - match nul
                </p>
              )}
            </div>
          )}

          {/* Timer integration hint */}
          {match.timerRoomCode && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
              <Timer className="h-4 w-4" />
              <span>Room timer: {match.timerRoomCode}</span>
            </div>
          )}

          {/* High/Low score indicator */}
          {!highScoreWins && (
            <p className="text-xs text-muted-foreground text-center">
              ⚙️ Le score le plus bas gagne (configuré pour ce tournoi)
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-muted/30 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          {isBestOfMode ? (
            <>
              {/* Bouton sauvegarder en cours (partiel) */}
              {!isMatchComplete && canSave && (
                <Button 
                  variant="secondary"
                  onClick={() => handleSubmit(true)}
                  className="flex-1"
                >
                  Sauvegarder ({p1Wins}-{p2Wins})
                </Button>
              )}
              {/* Bouton confirmer (match terminé) */}
              <Button 
                onClick={() => handleSubmit(false)} 
                disabled={!isMatchComplete}
                className="flex-1"
              >
                {isMatchComplete ? 'Confirmer la victoire' : `En attente (${winsNeeded} victoires)`}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSimpleSubmit}
              className="flex-1"
            >
              Confirmer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
