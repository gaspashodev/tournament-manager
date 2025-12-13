import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ChevronRight,
  Swords,
  GitBranch,
  Grid3X3,
  Medal,
  Shuffle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tournament, TournamentFormat, TournamentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
}

const formatIcons: Record<TournamentFormat, typeof Trophy> = {
  single_elimination: Swords,
  double_elimination: GitBranch,
  groups: Grid3X3,
  championship: Medal,
  swiss: Shuffle
};

const formatLabels: Record<TournamentFormat, string> = {
  single_elimination: 'Élimination directe',
  double_elimination: 'Double élimination',
  groups: 'Phases de groupes',
  championship: 'Championnat',
  swiss: 'Système suisse'
};

const statusLabels: Record<TournamentStatus, string> = {
  draft: 'Brouillon',
  registration: 'Inscriptions',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé'
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const FormatIcon = formatIcons[tournament.format];
  
  const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
  const totalMatches = tournament.matches.length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <Card className={cn(
        "group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300",
        "hover:-translate-y-1"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                tournament.status === 'completed' 
                  ? "bg-success/10 text-success"
                  : tournament.status === 'in_progress'
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
              )}>
                <FormatIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  {tournament.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatLabels[tournament.format]}
                </p>
              </div>
            </div>
            <Badge variant={tournament.status}>
              {statusLabels[tournament.status]}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {tournament.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tournament.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{tournament.participants.length} participants</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {tournament.status === 'in_progress' && totalMatches > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{completedMatches}/{totalMatches} matchs</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {tournament.game && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {tournament.game}
              </Badge>
              {tournament.category && (
                <Badge variant="outline" className="text-xs">
                  {tournament.category}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-end text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium">Voir le tournoi</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
