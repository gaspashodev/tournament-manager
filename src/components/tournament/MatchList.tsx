import { Clock, CheckCircle2, PlayCircle, Timer, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Match, Participant, ParticipantStatus } from '@/types';

interface MatchListProps {
  matches: Match[];
  participants: Participant[];
  participantStatuses?: ParticipantStatus[];
  onMatchClick?: (match: Match) => void;
  groupName?: string;
}

export function MatchList({ matches, participants, participantStatuses = [], onMatchClick, groupName }: MatchListProps) {
  const getParticipant = (id?: string) => participants.find(p => p.id === id);
  const isEliminated = (id?: string) => {
    if (!id) return false;
    return participantStatuses.find(s => s.participantId === id && s.isEliminated);
  };
  const isForfeitMatch = (match: Match) => {
    // Forfait = élimination sans repêchage (premier tour)
    return participantStatuses.some(s => s.forfeitMatchId === match.id && !s.promotedOpponentId);
  };

  const sortedMatches = [...matches].sort((a, b) => {
    // Trier par statut puis par round puis par position
    const statusOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (a.round !== b.round) return a.round - b.round;
    return a.position - b.position;
  });

  return (
    <div className="space-y-3">
      {groupName && (
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{groupName}</h4>
      )}
      
      {sortedMatches.map(match => {
        const p1 = getParticipant(match.participant1Id);
        const p2 = getParticipant(match.participant2Id);
        const p1Eliminated = isEliminated(match.participant1Id);
        const p2Eliminated = isEliminated(match.participant2Id);
        const isForfeit = isForfeitMatch(match);
        // Cliquable si pending ou completed (pour modifier)
        const isClickable = (match.status === 'pending' || match.status === 'completed') && p1 && p2;
        
        return (
          <div
            key={match.id}
            onClick={isClickable ? () => onMatchClick?.(match) : undefined}
            className={cn(
              "flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200",
              isClickable && "cursor-pointer hover:border-primary hover:shadow-md",
              match.status === 'completed' && !isForfeit && "border-success/30 bg-success/5",
              match.status === 'in_progress' && "border-warning/30 bg-warning/5",
              isForfeit && "border-destructive/30 bg-destructive/5"
            )}
          >
            {/* Status icon */}
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              match.status === 'pending' && "bg-muted text-muted-foreground",
              match.status === 'in_progress' && "bg-warning/20 text-warning",
              match.status === 'completed' && !isForfeit && "bg-success/20 text-success",
              isForfeit && "bg-destructive/20 text-destructive"
            )}>
              {match.status === 'pending' && <Clock className="h-5 w-5" />}
              {match.status === 'in_progress' && <PlayCircle className="h-5 w-5" />}
              {match.status === 'completed' && !isForfeit && <CheckCircle2 className="h-5 w-5" />}
              {isForfeit && <Ban className="h-5 w-5" />}
            </div>
            
            {/* Participants */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                {/* Participant 1 */}
                <div className={cn(
                  "flex-1 flex items-center gap-2",
                  match.winnerId === match.participant1Id && !p1Eliminated && "font-semibold",
                  p1Eliminated && "opacity-60"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                    p1Eliminated ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    {p1Eliminated ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      p1?.name.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <span className={cn(
                    "truncate",
                    p1Eliminated && "line-through text-muted-foreground"
                  )}>
                    {p1?.name || 'À déterminer'}
                  </span>
                </div>
                
                {/* Score */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg font-mono text-lg",
                  isForfeit ? "bg-destructive/10" : "bg-muted"
                )}>
                  {match.score ? (
                    <>
                      <span className={cn(
                        match.winnerId === match.participant1Id && !isForfeit && "text-success font-bold",
                        p1Eliminated && "text-destructive"
                      )}>
                        {match.score.participant1Score}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={cn(
                        match.winnerId === match.participant2Id && !isForfeit && "text-success font-bold",
                        p2Eliminated && "text-destructive"
                      )}>
                        {match.score.participant2Score}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">VS</span>
                  )}
                </div>
                
                {/* Participant 2 */}
                <div className={cn(
                  "flex-1 flex items-center gap-2 justify-end",
                  match.winnerId === match.participant2Id && !p2Eliminated && "font-semibold",
                  p2Eliminated && "opacity-60"
                )}>
                  <span className={cn(
                    "truncate text-right",
                    p2Eliminated && "line-through text-muted-foreground"
                  )}>
                    {p2?.name || 'À déterminer'}
                  </span>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                    p2Eliminated ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    {p2Eliminated ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      p2?.name.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Badge forfait */}
            {isForfeit && (
              <Badge variant="destructive" className="text-xs">
                Forfait
              </Badge>
            )}
            
            {/* Timer room code */}
            {match.timerRoomCode && !isForfeit && (
              <Badge variant="outline" className="gap-1.5">
                <Timer className="h-3 w-3" />
                {match.timerRoomCode}
              </Badge>
            )}
          </div>
        );
      })}
      
      {matches.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun match à afficher
        </div>
      )}
    </div>
  );
}
