import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Settings, 
  Trash2, 
  Users,
  Trophy,
  LayoutGrid,
  List,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BracketView, 
  ParticipantsList, 
  MatchList, 
  GroupStandingsTable,
  MatchResultModal 
} from '@/components/tournament';
import { useTournament } from '@/context/TournamentContext';
import { cn } from '@/lib/utils';
import type { Match, TournamentStatus } from '@/types';

type ViewMode = 'bracket' | 'list' | 'groups';

const statusLabels: Record<TournamentStatus, string> = {
  draft: 'Brouillon',
  registration: 'Inscriptions',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé'
};

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    tournaments, 
    addParticipant, 
    removeParticipant,
    generateBracket,
    startTournament,
    submitMatchResult,
    deleteTournament
  } = useTournament();

  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const tournament = tournaments.find(t => t.id === id);

  useEffect(() => {
    if (tournament?.format === 'groups') {
      setViewMode('groups');
    } else if (tournament?.format === 'championship') {
      setViewMode('list');
    }
  }, [tournament?.format]);

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tournoi non trouvé</h2>
        <p className="text-muted-foreground mb-4">Ce tournoi n'existe pas ou a été supprimé</p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }

  const handleAddParticipant = (name: string) => {
    addParticipant(tournament.id, { name });
  };

  const handleRemoveParticipant = (participantId: string) => {
    removeParticipant(tournament.id, participantId);
  };

  const handleGenerateBracket = () => {
    generateBracket(tournament.id);
  };

  const handleStartTournament = () => {
    startTournament(tournament.id);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleSubmitResult = (winnerId: string, score1: number, score2: number) => {
    if (selectedMatch) {
      submitMatchResult({
        matchId: selectedMatch.id,
        winnerId,
        participant1Score: score1,
        participant2Score: score2
      });
      setSelectedMatch(null);
    }
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      deleteTournament(tournament.id);
      navigate('/');
    }
  };

  const canGenerateBracket = tournament.status === 'draft' && tournament.participants.length >= 2;
  const canStart = tournament.status === 'registration' && tournament.matches.length > 0;
  const isEditable = tournament.status === 'draft';

  const winner = tournament.winnerId 
    ? tournament.participants.find(p => p.id === tournament.winnerId)
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold">{tournament.name}</h1>
              <Badge variant={tournament.status} className="text-xs">
                {statusLabels[tournament.status]}
              </Badge>
            </div>
            {tournament.description && (
              <p className="text-muted-foreground max-w-xl">{tournament.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {tournament.game && <span>{tournament.game}</span>}
              {tournament.category && <span>• {tournament.category}</span>}
              <span>• {tournament.participants.length} participants</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          {canGenerateBracket && (
            <Button onClick={handleGenerateBracket}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Générer le bracket
            </Button>
          )}
          {canStart && (
            <Button onClick={handleStartTournament} variant="success">
              <Play className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <Card className="border-success bg-gradient-to-r from-success/10 to-success/5">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-success font-medium">Vainqueur du tournoi</p>
              <h2 className="font-display text-2xl font-bold">{winner.name}</h2>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* View mode selector */}
          {tournament.matches.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
              {tournament.format !== 'championship' && (
                <Button
                  variant={viewMode === 'bracket' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('bracket')}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Bracket
                </Button>
              )}
              {tournament.format === 'groups' && (
                <Button
                  variant={viewMode === 'groups' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('groups')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Groupes
                </Button>
              )}
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
            </div>
          )}

          {/* Bracket view */}
          {viewMode === 'bracket' && tournament.format !== 'championship' && (
            <Card>
              <CardHeader>
                <CardTitle>Bracket</CardTitle>
              </CardHeader>
              <CardContent>
                <BracketView
                  matches={tournament.matches}
                  participants={tournament.participants}
                  onMatchClick={handleMatchClick}
                />
              </CardContent>
            </Card>
          )}

          {/* Groups view */}
          {viewMode === 'groups' && tournament.format === 'groups' && (
            <div className="space-y-6">
              {tournament.groups?.map(group => (
                <GroupStandingsTable
                  key={group.id}
                  group={group}
                  participants={tournament.participants}
                  qualifiersCount={tournament.config.qualifiersPerGroup}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>Matchs</CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.format === 'groups' ? (
                  <div className="space-y-6">
                    {tournament.groups?.map(group => (
                      <MatchList
                        key={group.id}
                        matches={tournament.matches.filter(m => m.groupId === group.id)}
                        participants={tournament.participants}
                        onMatchClick={handleMatchClick}
                        groupName={group.name}
                      />
                    ))}
                  </div>
                ) : (
                  <MatchList
                    matches={tournament.matches}
                    participants={tournament.participants}
                    onMatchClick={handleMatchClick}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {tournament.matches.length === 0 && tournament.status === 'draft' && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun bracket généré</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Ajoutez au moins 2 participants puis générez le bracket pour commencer le tournoi
                </p>
                {canGenerateBracket && (
                  <Button onClick={handleGenerateBracket}>
                    Générer le bracket
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantsList
                participants={tournament.participants}
                onAdd={handleAddParticipant}
                onRemove={handleRemoveParticipant}
                disabled={!isEditable}
                winnerId={tournament.winnerId}
              />
            </CardContent>
          </Card>

          {/* Stats */}
          {tournament.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Matchs joués</span>
                  <span className="font-semibold">
                    {tournament.matches.filter(m => m.status === 'completed').length} / {tournament.matches.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold">
                    {Math.round((tournament.matches.filter(m => m.status === 'completed').length / tournament.matches.length) * 100)}%
                  </span>
                </div>
                {tournament.startedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Démarré le</span>
                    <span className="font-semibold">
                      {new Date(tournament.startedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timer integration (for future use) */}
          <Card className="border-dashed opacity-60">
            <CardContent className="flex items-center gap-3 py-4">
              <Timer className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Intégration Timer</p>
                <p className="text-xs text-muted-foreground">Bientôt disponible</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Match result modal */}
      {selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          participants={tournament.participants}
          onSubmit={handleSubmitResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
