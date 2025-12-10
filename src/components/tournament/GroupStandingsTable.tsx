import { cn } from '@/lib/utils';
import type { Group, Participant } from '@/types';

interface GroupStandingsTableProps {
  group: Group;
  participants: Participant[];
  qualifiersCount?: number;
}

export function GroupStandingsTable({ 
  group, 
  participants,
  qualifiersCount = 2
}: GroupStandingsTableProps) {
  const standings = (group.standings || [])
    .map(standing => ({
      ...standing,
      participant: participants.find(p => p.id === standing.participantId)
    }))
    .sort((a, b) => {
      // Trier par points, puis différence de buts, puis buts marqués
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointsFor - a.pointsFor;
    });

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
              <th className="px-4 py-2 text-left font-medium">Équipe</th>
              <th className="px-4 py-2 text-center font-medium">J</th>
              <th className="px-4 py-2 text-center font-medium">V</th>
              <th className="px-4 py-2 text-center font-medium">N</th>
              <th className="px-4 py-2 text-center font-medium">D</th>
              <th className="px-4 py-2 text-center font-medium">BP</th>
              <th className="px-4 py-2 text-center font-medium">BC</th>
              <th className="px-4 py-2 text-center font-medium">Diff</th>
              <th className="px-4 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => {
              const diff = standing.pointsFor - standing.pointsAgainst;
              const isQualified = index < qualifiersCount;
              
              return (
                <tr 
                  key={standing.participantId}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isQualified && "bg-success/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isQualified 
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {standing.participant?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">
                        {standing.participant?.name || 'Inconnu'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{standing.played}</td>
                  <td className="px-4 py-3 text-center text-sm text-success">{standing.won}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{standing.drawn}</td>
                  <td className="px-4 py-3 text-center text-sm text-destructive">{standing.lost}</td>
                  <td className="px-4 py-3 text-center text-sm">{standing.pointsFor}</td>
                  <td className="px-4 py-3 text-center text-sm">{standing.pointsAgainst}</td>
                  <td className={cn(
                    "px-4 py-3 text-center text-sm font-medium",
                    diff > 0 && "text-success",
                    diff < 0 && "text-destructive"
                  )}>
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-lg">
                      {standing.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
