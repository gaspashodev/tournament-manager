import { Link } from 'react-router-dom';
import { 
  Plus, 
  Trophy, 
  Swords, 
  GitBranch, 
  Grid3X3, 
  Medal,
  Users,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TournamentCard } from '@/components/tournament';
import { useTournament } from '@/context/TournamentContext';
import type { TournamentFormat } from '@/types';

const formatOptions: { format: TournamentFormat; icon: typeof Trophy; label: string; description: string }[] = [
  {
    format: 'single_elimination',
    icon: Swords,
    label: 'Élimination directe',
    description: 'Perdre = éliminé'
  },
  {
    format: 'double_elimination',
    icon: GitBranch,
    label: 'Double élimination',
    description: '2 défaites = éliminé'
  },
  {
    format: 'groups',
    icon: Grid3X3,
    label: 'Phases de groupes',
    description: 'Groupes puis playoffs'
  },
  {
    format: 'championship',
    icon: Medal,
    label: 'Championnat',
    description: 'Tous contre tous'
  },
  {
    format: 'swiss',
    icon: Users,
    label: 'Système suisse',
    description: 'Rondes par niveau'
  }
];

export function HomePage() {
  const { tournaments } = useTournament();

  const activeTournaments = tournaments.filter(t => 
    t.status === 'in_progress' || t.status === 'registration'
  );
  const completedTournaments = tournaments.filter(t => t.status === 'completed');
  const draftTournaments = tournaments.filter(t => t.status === 'draft');

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Plateforme de gestion de tournois</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Tournament Manager
          </h1>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
            Créez et gérez facilement vos tournois de jeux de société, TCG et bien plus encore.
            Support de multiples formats de compétition.
          </p>
          
          <Link to="/tournaments/new">
            <Button size="xl" variant="secondary" className="shadow-xl">
              <Plus className="h-5 w-5 mr-2" />
              Créer un tournoi
            </Button>
          </Link>
        </div>
        
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <Trophy className="h-64 w-64" />
        </div>
      </div>

      {/* Quick create cards */}
      <div>
        <h2 className="font-display text-2xl font-semibold mb-6">Création rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {formatOptions.map(({ format, icon: Icon, label, description }) => (
            <Link key={format} to={`/tournaments/new?format=${format}`}>
              <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 h-full">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Active tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">Tournois en cours</h2>
            <span className="text-sm text-muted-foreground">
              {activeTournaments.length} tournoi{activeTournaments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {/* Draft tournaments */}
      {draftTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">Brouillons</h2>
            <span className="text-sm text-muted-foreground">
              {draftTournaments.length} tournoi{draftTournaments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tournaments */}
      {completedTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">Tournois terminés</h2>
            <span className="text-sm text-muted-foreground">
              {completedTournaments.length} tournoi{completedTournaments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tournaments.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <Trophy className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">Aucun tournoi</h3>
          <p className="text-muted-foreground mb-6">
            Commencez par créer votre premier tournoi
          </p>
          <Link to="/tournaments/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Créer un tournoi
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
