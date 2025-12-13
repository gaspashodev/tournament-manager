import { useMemo } from 'react';
import { Trophy, User, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, Participant, ParticipantStatus } from '@/types';

interface BracketViewProps {
  matches: Match[];
  participants: Participant[];
  participantStatuses?: ParticipantStatus[];
  onMatchClick?: (match: Match) => void;
}

interface MatchCardProps {
  match: Match;
  participants: Participant[];
  participantStatuses?: ParticipantStatus[];
  onClick?: () => void;
}

function MatchCard({ match, participants, participantStatuses = [], onClick }: MatchCardProps) {
  const participant1 = participants.find(p => p.id === match.participant1Id);
  const participant2 = participants.find(p => p.id === match.participant2Id);
  
  // Vérifier si les participants sont éliminés
  const isParticipant1Eliminated = participantStatuses.find(
    s => s.participantId === match.participant1Id && s.isEliminated
  );
  const isParticipant2Eliminated = participantStatuses.find(
    s => s.participantId === match.participant2Id && s.isEliminated
  );
  
  // Cliquable si pending, in_progress ou completed (pour modifier)
  const isClickable = (match.status === 'pending' || match.status === 'in_progress' || match.status === 'completed') && participant1 && participant2;
  const isCompleted = match.status === 'completed';
  const isInProgress = match.status === 'in_progress';
  
  // Vérifier si c'est un match de forfait (sans repêchage)
  // Un forfait = élimination au premier tour où l'adversaire gagne automatiquement
  const forfeitStatus = participantStatuses.find(s => 
    s.forfeitMatchId === match.id && !s.promotedOpponentId
  );
  const isForfeitMatch = !!forfeitStatus;

  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "w-48 rounded-lg border bg-card shadow-sm transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary hover:shadow-md",
        isCompleted && !isForfeitMatch && "border-success/30 bg-success/5",
        isInProgress && "border-warning/50 bg-warning/5 ring-2 ring-warning/30",
        isForfeitMatch && "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Participant 1 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b",
        isCompleted && match.winnerId === match.participant1Id && !isForfeitMatch && "bg-success/10",
        isInProgress && "bg-warning/5",
        isParticipant1Eliminated && "opacity-60"
      )}>
        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
          isParticipant1Eliminated ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
        )}>
          {participant1 ? (
            isParticipant1Eliminated ? (
              <Ban className="h-3 w-3" />
            ) : (
              participant1.seed || '?'
            )
          ) : (
            <User className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className={cn(
          "flex-1 text-sm truncate",
          !participant1 && "text-muted-foreground italic",
          match.winnerId === match.participant1Id && "font-semibold",
          isParticipant1Eliminated && "line-through text-muted-foreground"
        )}>
          {participant1?.name || 'À déterminer'}
        </span>
        {match.score && (
          <span className={cn(
            "font-mono text-sm font-medium",
            match.winnerId === match.participant1Id && !isForfeitMatch && "text-success",
            isInProgress && "text-warning",
            isParticipant1Eliminated && "text-destructive"
          )}>
            {match.score.participant1Score}
          </span>
        )}
        {match.winnerId === match.participant1Id && !isParticipant1Eliminated && (
          <Trophy className="h-3 w-3 text-success" />
        )}
      </div>
      
      {/* Participant 2 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2",
        isCompleted && match.winnerId === match.participant2Id && !isForfeitMatch && "bg-success/10",
        isInProgress && "bg-warning/5",
        isParticipant2Eliminated && "opacity-60"
      )}>
        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
          isParticipant2Eliminated ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
        )}>
          {participant2 ? (
            isParticipant2Eliminated ? (
              <Ban className="h-3 w-3" />
            ) : (
              participant2.seed || '?'
            )
          ) : (
            <User className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className={cn(
          "flex-1 text-sm truncate",
          !participant2 && "text-muted-foreground italic",
          match.winnerId === match.participant2Id && "font-semibold",
          isParticipant2Eliminated && "line-through text-muted-foreground"
        )}>
          {participant2?.name || 'À déterminer'}
        </span>
        {match.score && (
          <span className={cn(
            "font-mono text-sm font-medium",
            match.winnerId === match.participant2Id && !isForfeitMatch && "text-success",
            isInProgress && "text-warning",
            isParticipant2Eliminated && "text-destructive"
          )}>
            {match.score.participant2Score}
          </span>
        )}
        {match.winnerId === match.participant2Id && !isParticipant2Eliminated && (
          <Trophy className="h-3 w-3 text-success" />
        )}
      </div>
      
      {/* Badge En cours */}
      {isInProgress && (
        <div className="px-3 py-1 text-xs text-center text-warning bg-warning/10 border-t border-warning/20">
          En cours
        </div>
      )}
      
      {/* Badge forfait */}
      {isForfeitMatch && (
        <div className="px-3 py-1 text-xs text-center text-destructive bg-destructive/10 border-t border-destructive/20">
          Forfait
        </div>
      )}
    </div>
  );
}

export function BracketView({ matches, participants, participantStatuses = [], onMatchClick }: BracketViewProps) {
  // Organiser les matchs par round
  const rounds = useMemo(() => {
    const roundMap = new Map<number, Match[]>();
    
    matches.forEach(match => {
      const roundMatches = roundMap.get(match.round) || [];
      roundMatches.push(match);
      roundMap.set(match.round, roundMatches);
    });
    
    // Trier les rounds
    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({
        round,
        matches: roundMatches.sort((a, b) => a.position - b.position)
      }));
  }, [matches]);

  const getRoundName = (round: number, totalRounds: number) => {
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return 'Finale';
    if (remaining === 2) return 'Demi-finales';
    if (remaining === 3) return 'Quarts de finale';
    if (remaining === 4) return 'Huitièmes de finale';
    return `Tour ${round}`;
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Aucun bracket généré</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ajoutez des participants puis générez le bracket
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 p-4 min-w-max">
        {rounds.map(({ round, matches: roundMatches }) => (
          <div key={round} className="flex flex-col">
            <h4 className="text-sm font-semibold text-center mb-4 text-muted-foreground">
              {getRoundName(round, rounds.length)}
            </h4>
            <div 
              className="flex flex-col justify-around flex-1 gap-4"
              style={{ 
                paddingTop: `${Math.pow(2, round - 1) * 20}px`,
                gap: `${Math.pow(2, round) * 20}px`
              }}
            >
              {roundMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participants={participants}
                  participantStatuses={participantStatuses}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
