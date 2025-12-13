import { useState } from 'react';
import { 
  History, 
  Trophy, 
  UserPlus, 
  UserMinus, 
  Play,
  Flag,
  AlertTriangle,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TournamentEvent, TournamentEventType } from '@/types';

interface TournamentHistoryProps {
  events: TournamentEvent[];
  className?: string;
}

const eventIcons: Record<TournamentEventType, typeof Trophy> = {
  tournament_created: Flag,
  tournament_started: Play,
  tournament_completed: Trophy,
  participant_added: UserPlus,
  participant_removed: UserMinus,
  bracket_generated: Users,
  match_started: Play,
  match_completed: Flag,
  match_score_updated: RefreshCw,
  penalty_added: AlertTriangle,
  penalty_removed: RefreshCw,
  participant_eliminated: UserMinus,
  participant_reinstated: UserPlus
};

const eventColors: Record<TournamentEventType, string> = {
  tournament_created: 'text-primary',
  tournament_started: 'text-success',
  tournament_completed: 'text-warning',
  participant_added: 'text-success',
  participant_removed: 'text-muted-foreground',
  bracket_generated: 'text-primary',
  match_started: 'text-primary',
  match_completed: 'text-success',
  match_score_updated: 'text-warning',
  penalty_added: 'text-destructive',
  penalty_removed: 'text-muted-foreground',
  participant_eliminated: 'text-destructive',
  participant_reinstated: 'text-success'
};

function formatEventTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  // Toujours afficher la date complète avec l'heure
  const dateStr = d.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
  const timeStr = d.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Ajouter un indicateur relatif pour les événements récents
  if (diffMins < 1) return `${dateStr} à ${timeStr} (à l'instant)`;
  if (diffMins < 60) return `${dateStr} à ${timeStr} (il y a ${diffMins} min)`;
  
  return `${dateStr} à ${timeStr}`;
}

export function TournamentHistory({ events, className }: TournamentHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const displayedEvents = isExpanded ? sortedEvents : sortedEvents.slice(0, 5);
  const hasMore = sortedEvents.length > 5;

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historique
          <span className="text-sm font-normal text-muted-foreground">
            ({events.length} événement{events.length > 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedEvents.map((event) => {
            const Icon = eventIcons[event.type] || Flag;
            const colorClass = eventColors[event.type] || 'text-muted-foreground';
            
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir tout ({sortedEvents.length - 5} de plus)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
