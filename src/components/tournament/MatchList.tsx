import { Clock, CheckCircle2, PlayCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Match, Participant } from '@/types';

interface MatchListProps {
  matches: Match[];
  participants: Participant[];
  onMatchClick?: (match: Match) => void;
  groupName?: string;
}

export function MatchList({ matches, participants, onMatchClick, groupName }: MatchListProps) {
  const getParticipant = (id?: string) => participants.find(p => p.id === id);

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
        const isClickable = match.status === 'pending' && p1 && p2;
        
        return (
          <div
            key={match.id}
            onClick={isClickable ? () => onMatchClick?.(match) : undefined}
            className={cn(
              "flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200",
              isClickable && "cursor-pointer hover:border-primary hover:shadow-md",
              match.status === 'completed' && "border-success/30 bg-success/5",
              match.status === 'in_progress' && "border-warning/30 bg-warning/5"
            )}
          >
            {/* Status icon */}
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              match.status === 'pending' && "bg-muted text-muted-foreground",
              match.status === 'in_progress' && "bg-warning/20 text-warning",
              match.status === 'completed' && "bg-success/20 text-success"
            )}>
              {match.status === 'pending' && <Clock className="h-5 w-5" />}
              {match.status === 'in_progress' && <PlayCircle className="h-5 w-5" />}
              {match.status === 'completed' && <CheckCircle2 className="h-5 w-5" />}
            </div>
            
            {/* Participants */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                {/* Participant 1 */}
                <div className={cn(
                  "flex-1 flex items-center gap-2",
                  match.winnerId === match.participant1Id && "font-semibold"
                )}>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {p1?.name.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="truncate">{p1?.name || 'À déterminer'}</span>
                </div>
                
                {/* Score */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted font-mono text-lg">
                  {match.score ? (
                    <>
                      <span className={cn(
                        match.winnerId === match.participant1Id && "text-success font-bold"
                      )}>
                        {match.score.participant1Score}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={cn(
                        match.winnerId === match.participant2Id && "text-success font-bold"
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
                  match.winnerId === match.participant2Id && "font-semibold"
                )}>
                  <span className="truncate text-right">{p2?.name || 'À déterminer'}</span>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {p2?.name.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timer room code */}
            {match.timerRoomCode && (
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
