import { useMemo } from 'react';
import { Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, Participant } from '@/types';

interface BracketViewProps {
  matches: Match[];
  participants: Participant[];
  onMatchClick?: (match: Match) => void;
}

interface MatchCardProps {
  match: Match;
  participants: Participant[];
  onClick?: () => void;
}

function MatchCard({ match, participants, onClick }: MatchCardProps) {
  const participant1 = participants.find(p => p.id === match.participant1Id);
  const participant2 = participants.find(p => p.id === match.participant2Id);
  
  const isClickable = match.status === 'pending' && participant1 && participant2;
  const isCompleted = match.status === 'completed';

  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "w-48 rounded-lg border bg-card shadow-sm transition-all duration-200",
        isClickable && "cursor-pointer hover:border-primary hover:shadow-md",
        isCompleted && "border-success/30 bg-success/5"
      )}
    >
      {/* Participant 1 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b",
        isCompleted && match.winnerId === match.participant1Id && "bg-success/10"
      )}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
          {participant1 ? (
            participant1.name.charAt(0).toUpperCase()
          ) : (
            <User className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className={cn(
          "flex-1 text-sm truncate",
          !participant1 && "text-muted-foreground italic",
          match.winnerId === match.participant1Id && "font-semibold"
        )}>
          {participant1?.name || 'À déterminer'}
        </span>
        {match.score && (
          <span className={cn(
            "font-mono text-sm font-medium",
            match.winnerId === match.participant1Id && "text-success"
          )}>
            {match.score.participant1Score}
          </span>
        )}
        {match.winnerId === match.participant1Id && (
          <Trophy className="h-3 w-3 text-success" />
        )}
      </div>
      
      {/* Participant 2 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2",
        isCompleted && match.winnerId === match.participant2Id && "bg-success/10"
      )}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
          {participant2 ? (
            participant2.name.charAt(0).toUpperCase()
          ) : (
            <User className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span className={cn(
          "flex-1 text-sm truncate",
          !participant2 && "text-muted-foreground italic",
          match.winnerId === match.participant2Id && "font-semibold"
        )}>
          {participant2?.name || 'À déterminer'}
        </span>
        {match.score && (
          <span className={cn(
            "font-mono text-sm font-medium",
            match.winnerId === match.participant2Id && "text-success"
          )}>
            {match.score.participant2Score}
          </span>
        )}
        {match.winnerId === match.participant2Id && (
          <Trophy className="h-3 w-3 text-success" />
        )}
      </div>
    </div>
  );
}

export function BracketView({ matches, participants, onMatchClick }: BracketViewProps) {
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
