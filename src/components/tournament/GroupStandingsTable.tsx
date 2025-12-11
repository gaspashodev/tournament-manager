import { cn } from '@/lib/utils';
import type { Group, Participant, Match, Penalty, ParticipantStatus } from '@/types';
import { AlertTriangle, Ban } from 'lucide-react';

interface GroupStandingsTableProps {
  group: Group;
  participants: Participant[];
  matches?: Match[];
  penalties?: Penalty[];
  participantStatuses?: ParticipantStatus[];
  qualifiersCount?: number;
  showScoreDetails?: boolean;
  useHeadToHead?: boolean;
  onParticipantClick?: (participant: Participant) => void;
}

// Helper pour trouver le vainqueur de la confrontation directe
function getHeadToHeadWinner(
  participant1Id: string,
  participant2Id: string,
  matches: Match[]
): string | undefined {
  const headToHeadMatches = matches.filter(m => 
    m.status === 'completed' &&
    ((m.participant1Id === participant1Id && m.participant2Id === participant2Id) ||
     (m.participant1Id === participant2Id && m.participant2Id === participant1Id))
  );
  
  if (headToHeadMatches.length === 0) return undefined;
  
  let wins1 = 0;
  let wins2 = 0;
  
  for (const match of headToHeadMatches) {
    if (match.winnerId === participant1Id) wins1++;
    else if (match.winnerId === participant2Id) wins2++;
  }
  
  if (wins1 > wins2) return participant1Id;
  if (wins2 > wins1) return participant2Id;
  return undefined;
}

// Vérifie si deux standings sont à égalité parfaite (stats identiques)
function areStandingsEqual(a: { points: number; pointsFor: number; pointsAgainst: number }, 
                          b: { points: number; pointsFor: number; pointsAgainst: number }): boolean {
  const aDiff = a.pointsFor - a.pointsAgainst;
  const bDiff = b.pointsFor - b.pointsAgainst;
  return a.points === b.points && aDiff === bDiff && a.pointsFor === b.pointsFor;
}

export function GroupStandingsTable({ 
  group, 
  participants,
  matches = [],
  penalties = [],
  participantStatuses = [],
  qualifiersCount,
  showScoreDetails = false,
  useHeadToHead = false,
  onParticipantClick
}: GroupStandingsTableProps) {
  // Helper pour obtenir les pénalités d'un participant
  const getParticipantPenalties = (participantId: string) => {
    return penalties.filter(p => p.participantId === participantId);
  };

  // Helper pour vérifier si un participant est éliminé
  const isParticipantEliminated = (participantId: string) => {
    const status = participantStatuses.find(s => s.participantId === participantId);
    return status?.isEliminated || false;
  };

  // Préparer les standings avec les infos de participant
  const standingsWithParticipant = (group.standings || [])
    .map(standing => ({
      ...standing,
      participant: participants.find(p => p.id === standing.participantId)
    }));
  
  // Trier avec confrontation directe si activée
  const sortedStandings = [...standingsWithParticipant].sort((a, b) => {
    // D'abord par points
    if (b.points !== a.points) return b.points - a.points;
    
    // Ensuite par différence
    const aDiff = a.pointsFor - a.pointsAgainst;
    const bDiff = b.pointsFor - b.pointsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    
    // Ensuite par score marqué
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    
    // Si égalité parfaite et confrontation directe activée
    if (useHeadToHead && matches.length > 0) {
      const h2hWinner = getHeadToHeadWinner(a.participantId, b.participantId, matches);
      if (h2hWinner === a.participantId) return -1;
      if (h2hWinner === b.participantId) return 1;
    }
    
    return 0;
  });
  
  // Calculer les positions avec ex-aequo
  const positions: number[] = [];
  let currentPosition = 1;
  
  for (let i = 0; i < sortedStandings.length; i++) {
    if (i === 0) {
      positions.push(1);
    } else {
      const current = sortedStandings[i];
      const previous = sortedStandings[i - 1];
      
      // Vérifier si égalité parfaite avec le précédent
      const isPerfectTie = areStandingsEqual(current, previous);
      
      // Si égalité parfaite et pas de départage par confrontation directe
      if (isPerfectTie) {
        if (useHeadToHead && matches.length > 0) {
          const h2hWinner = getHeadToHeadWinner(current.participantId, previous.participantId, matches);
          if (h2hWinner) {
            // Il y a un vainqueur en confrontation directe, donc pas ex-aequo
            positions.push(currentPosition);
          } else {
            // Pas de vainqueur en confrontation directe = ex-aequo
            positions.push(positions[i - 1]);
          }
        } else {
          // Pas de confrontation directe = ex-aequo
          positions.push(positions[i - 1]);
        }
      } else {
        // Pas d'égalité parfaite
        positions.push(currentPosition);
      }
    }
    currentPosition++;
  }

  // Vérifier si le joueur est départagé par confrontation directe (pour afficher *)
  const hasHeadToHeadAdvantage = (index: number): boolean => {
    if (!useHeadToHead || matches.length === 0 || index === 0) return false;
    
    const current = sortedStandings[index];
    const previous = sortedStandings[index - 1];
    
    if (!areStandingsEqual(current, previous)) return false;
    
    const h2hWinner = getHeadToHeadWinner(previous.participantId, current.participantId, matches);
    return h2hWinner === previous.participantId;
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b">
        <h3 className="font-display font-semibold">{group.name}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Pos</th>
              <th className="px-4 py-2 text-left font-medium">Joueur</th>
              <th className="px-4 py-2 text-center font-medium">J</th>
              <th className="px-4 py-2 text-center font-medium">V</th>
              <th className="px-4 py-2 text-center font-medium">N</th>
              <th className="px-4 py-2 text-center font-medium">D</th>
              {showScoreDetails && (
                <>
                  <th className="px-4 py-2 text-center font-medium">BP</th>
                  <th className="px-4 py-2 text-center font-medium">BC</th>
                  <th className="px-4 py-2 text-center font-medium">Diff</th>
                </>
              )}
              <th className="px-4 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((standing, index) => {
              const diff = standing.pointsFor - standing.pointsAgainst;
              const position = positions[index];
              const isQualified = qualifiersCount !== undefined && position <= qualifiersCount;
              const showH2HAsterisk = index > 0 && hasHeadToHeadAdvantage(index);
              const isEliminated = isParticipantEliminated(standing.participantId);
              const participantPenalties = getParticipantPenalties(standing.participantId);
              const totalPenalty = participantPenalties.reduce((sum, p) => sum + p.points, 0);
              
              return (
                <tr 
                  key={standing.participantId}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isQualified && !isEliminated && "bg-success/5",
                    isEliminated && "bg-destructive/5 opacity-60",
                    onParticipantClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => standing.participant && onParticipantClick?.(standing.participant)}
                >
                  <td className="px-4 py-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isEliminated 
                        ? "bg-destructive/20 text-destructive"
                        : isQualified 
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {isEliminated ? <Ban className="h-3 w-3" /> : position}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                        isEliminated ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        {standing.participant?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-medium",
                          isEliminated && "line-through"
                        )}>
                          {standing.participant?.name || 'Inconnu'}
                          {showH2HAsterisk && (
                            <span className="text-xs text-muted-foreground ml-1" title="Départagé par confrontation directe">*</span>
                          )}
                        </span>
                        {(totalPenalty > 0 || isEliminated) && (
                          <div className="flex items-center gap-1">
                            {totalPenalty > 0 && (
                              <span className="text-xs text-warning flex items-center gap-0.5" title={`${participantPenalties.length} pénalité(s)`}>
                                <AlertTriangle className="h-3 w-3" />
                                -{totalPenalty}
                              </span>
                            )}
                            {isEliminated && (
                              <span className="text-xs text-destructive">Éliminé</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{standing.played}</td>
                  <td className="px-4 py-3 text-center text-sm text-success">{standing.won}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{standing.drawn}</td>
                  <td className="px-4 py-3 text-center text-sm text-destructive">{standing.lost}</td>
                  {showScoreDetails && (
                    <>
                      <td className="px-4 py-3 text-center text-sm">{standing.pointsFor}</td>
                      <td className="px-4 py-3 text-center text-sm">{standing.pointsAgainst}</td>
                      <td className={cn(
                        "px-4 py-3 text-center text-sm font-medium",
                        diff > 0 && "text-success",
                        diff < 0 && "text-destructive"
                      )}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "font-mono font-bold text-lg",
                      totalPenalty > 0 && "text-warning"
                    )}>
                      {standing.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {useHeadToHead && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            * Départagé par confrontation directe
          </div>
        )}
      </div>
    </div>
  );
}
