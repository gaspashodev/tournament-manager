import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Trash2, 
  Users,
  Trophy,
  LayoutGrid,
  List,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BracketView, 
  ParticipantsList, 
  MatchList, 
  GroupStandingsTable,
  MatchResultModal,
  WinnerSelectionModal,
  ParticipantManagementModal,
  TournamentHistory
} from '@/components/tournament';
import { useTournament } from '@/context/TournamentContext';
import type { Match, TournamentStatus, Participant } from '@/types';

type ViewMode = 'bracket' | 'list' | 'standings';

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
    generateSwissNextRound,
    startTournament,
    submitMatchResult,
    deleteTournament,
    setTournamentWinner,
    addPenalty,
    removePenalty,
    eliminateParticipant,
    reinstateParticipant,
    updateParticipantSeed
  } = useTournament();

  const tournament = tournaments.find(t => t.id === id);

  // Déterminer le mode de vue par défaut selon le format
  const getDefaultViewMode = (): ViewMode => {
    if (!tournament) return 'bracket';
    if (tournament.format === 'groups' || tournament.format === 'championship' || tournament.format === 'swiss') {
      return 'standings';
    }
    return 'bracket';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultViewMode());
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    if (tournament) {
      if (tournament.format === 'groups' || tournament.format === 'championship' || tournament.format === 'swiss') {
        setViewMode('standings');
      }
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

  const handleAddParticipant = async (name: string) => {
    await addParticipant(tournament.id, { name });
  };

  const handleRemoveParticipant = async (participantId: string) => {
    await removeParticipant(tournament.id, participantId);
  };

  const handleGenerateBracket = async () => {
    await generateBracket(tournament.id);
  };

  const handleGenerateSwissNextRound = async () => {
    await generateSwissNextRound(tournament.id);
  };

  const handleStartTournament = () => {
    startTournament(tournament.id);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleSubmitResult = (result: {
    winnerId: string | undefined;
    score1: number;
    score2: number;
    games: import('@/types').Game[];
    isPartial?: boolean;
  }) => {
    if (selectedMatch) {
      submitMatchResult({
        matchId: selectedMatch.id,
        winnerId: result.winnerId,
        participant1Score: result.score1,
        participant2Score: result.score2,
        games: result.games,
        isPartial: result.isPartial
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
  const canAddParticipants = tournament.status === 'draft';
  const canRemoveParticipants = tournament.status === 'draft';
  
  // Système suisse : vérifier si on peut générer la ronde suivante
  const currentSwissRound = tournament.format === 'swiss' 
    ? Math.max(...tournament.matches.map(m => m.round), 0)
    : 0;
  const totalSwissRounds = tournament.config.swissRounds || 
    Math.ceil(Math.log2(tournament.participants.length));
  const currentRoundCompleted = tournament.format === 'swiss' && currentSwissRound > 0
    ? tournament.matches
        .filter(m => m.round === currentSwissRound)
        .every(m => m.status === 'completed')
    : false;
  const canGenerateSwissNextRound = tournament.format === 'swiss' 
    && (tournament.status === 'in_progress' || tournament.status === 'registration')
    && currentRoundCompleted
    && currentSwissRound < totalSwissRounds;

  // Calculer le Best-of applicable pour un match donné
  const getBestOfForMatch = (match: Match): number => {
    const config = tournament.config;
    const defaultBo = config.bestOf || 1;
    
    // Pour élimination simple/double : vérifier si c'est la finale
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      const maxRound = Math.max(...tournament.matches.map(m => m.round));
      if (match.round === maxRound) {
        return config.bestOfFinal || defaultBo;
      }
      return defaultBo;
    }
    
    // Pour les groupes : différencier groupes, playoffs et finale
    if (tournament.format === 'groups') {
      if (match.groupId) {
        return config.bestOfGroups || defaultBo;
      }
      const playoffsMatches = tournament.matches.filter(m => !m.groupId);
      if (playoffsMatches.length > 0) {
        const maxPlayoffRound = Math.max(...playoffsMatches.map(m => m.round));
        if (match.round === maxPlayoffRound) {
          return config.bestOfPlayoffsFinal || config.bestOfPlayoffs || defaultBo;
        }
        return config.bestOfPlayoffs || defaultBo;
      }
    }
    
    return defaultBo;
  };

  const winner = tournament.winnerId 
    ? tournament.participants.find(p => p.id === tournament.winnerId)
    : null;

  const allMatchesCompleted = tournament.matches.length > 0 && 
    tournament.matches.every(m => m.status === 'completed');
  
  // Pour Swiss, on utilise swissCompleted au lieu de needsWinnerSelection
  const needsWinnerSelection = allMatchesCompleted && !tournament.winnerId && tournament.format !== 'swiss';

  // Pour Swiss : vérifier si toutes les rondes sont terminées
  const swissCompleted = tournament.format === 'swiss' 
    && currentSwissRound >= totalSwissRounds 
    && currentRoundCompleted;

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
            {/* Format du tournoi */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs font-medium">
                {tournament.format === 'single_elimination' && 'Élimination simple'}
                {tournament.format === 'double_elimination' && 'Double élimination'}
                {tournament.format === 'groups' && 'Phases de groupes'}
                {tournament.format === 'championship' && 'Championnat'}
                {tournament.format === 'swiss' && 'Système suisse'}
              </Badge>
              {(tournament.config.bestOf || 1) > 1 && (
                <Badge variant="outline" className="text-xs font-medium">
                  BO{tournament.config.bestOf}
                  {tournament.config.bestOfFinal && tournament.config.bestOfFinal !== tournament.config.bestOf && 
                    ` (Finale: BO${tournament.config.bestOfFinal})`}
                </Badge>
              )}
              {tournament.format === 'swiss' && (
                <Badge variant="outline" className="text-xs font-medium">
                  Ronde {currentSwissRound}/{totalSwissRounds}
                </Badge>
              )}
              {tournament.config.seeding && tournament.config.seeding !== 'random' && tournament.format !== 'swiss' && (
                <Badge variant="outline" className="text-xs font-medium">
                  Seeding {tournament.config.seeding === 'manual' ? 'manuel' : 'classement'}
                </Badge>
              )}
            </div>
            {/* Infos supplémentaires */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {tournament.game && <span>{tournament.game}</span>}
              {tournament.category && <span>• {tournament.category}</span>}
              <span>• {tournament.participants.length} participant{tournament.participants.length !== 1 ? 's' : ''}</span>
              {tournament.scheduledStartDate && (
                <span>• Début : {new Date(tournament.scheduledStartDate).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              )}
              {tournament.registrationEndDate && tournament.status === 'draft' && (
                <span>• Inscriptions jusqu'au {new Date(tournament.registrationEndDate).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit'
                })}</span>
              )}
            </div>
          </div>
          {/* Image du tournoi */}
          {tournament.imageUrl && (
            <div className="hidden sm:block">
              <img 
                src={tournament.imageUrl} 
                alt={tournament.name}
                className="w-24 h-24 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          {canGenerateBracket && (
            <Button onClick={handleGenerateBracket}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              {tournament.format === 'swiss' ? 'Générer ronde 1' : 'Générer le bracket'}
            </Button>
          )}
          {canGenerateSwissNextRound && (
            <Button onClick={handleGenerateSwissNextRound} variant="secondary">
              <Play className="h-4 w-4 mr-2" />
              Générer ronde {currentSwissRound + 1}/{totalSwissRounds}
            </Button>
          )}
          {canStart && (
            <Button onClick={handleStartTournament} variant="success">
              <Play className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          )}
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

      {/* Needs winner selection banner */}
      {(needsWinnerSelection || swissCompleted) && !winner && (
        <Card className="border-warning bg-gradient-to-r from-warning/10 to-warning/5">
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 text-warning">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-warning font-medium">
                  {tournament.format === 'swiss' ? 'Tournoi terminé' : 'Égalité détectée'}
                </p>
                <h2 className="font-display text-lg font-semibold">Désignez le vainqueur du tournoi</h2>
              </div>
            </div>
            <Button onClick={() => setShowWinnerSelection(true)} variant="warning">
              <Trophy className="h-4 w-4 mr-2" />
              Choisir le vainqueur
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* View mode selector */}
          {tournament.matches.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
              {/* Bracket uniquement pour élimination simple/double */}
              {(tournament.format === 'single_elimination' || tournament.format === 'double_elimination') && (
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
              {/* Classement pour groupes, championnat et swiss */}
              {(tournament.format === 'groups' || tournament.format === 'championship' || tournament.format === 'swiss') && (
                <Button
                  variant={viewMode === 'standings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('standings')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Classement
                </Button>
              )}
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Matchs
              </Button>
            </div>
          )}

          {/* Bracket view - uniquement pour élimination */}
          {viewMode === 'bracket' && (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') && (
            <Card>
              <CardHeader>
                <CardTitle>Bracket</CardTitle>
              </CardHeader>
              <CardContent>
                <BracketView
                  matches={tournament.matches}
                  participants={tournament.participants}
                  participantStatuses={tournament.participantStatuses}
                  onMatchClick={handleMatchClick}
                />
              </CardContent>
            </Card>
          )}

          {/* Standings view - pour groupes, championnat et swiss */}
          {viewMode === 'standings' && (tournament.format === 'groups' || tournament.format === 'championship' || tournament.format === 'swiss') && (
            <div className="space-y-6">
              {tournament.groups?.map(group => (
                <GroupStandingsTable
                  key={group.id}
                  group={group}
                  participants={tournament.participants}
                  matches={tournament.matches.filter(m => 
                    m.groupId === group.id || 
                    tournament.format === 'championship' || 
                    tournament.format === 'swiss'
                  )}
                  penalties={tournament.penalties}
                  participantStatuses={tournament.participantStatuses}
                  qualifiersCount={tournament.format === 'groups' ? tournament.config.qualifiersPerGroup : undefined}
                  showScoreDetails={tournament.config.showScoreDetails}
                  useHeadToHead={tournament.config.useHeadToHead}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {tournament.format === 'swiss' 
                    ? `Matchs - Ronde ${currentSwissRound}/${totalSwissRounds}`
                    : 'Matchs'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.format === 'groups' ? (
                  <div className="space-y-6">
                    {tournament.groups?.map(group => (
                      <MatchList
                        key={group.id}
                        matches={tournament.matches.filter(m => m.groupId === group.id)}
                        participants={tournament.participants}
                        participantStatuses={tournament.participantStatuses}
                        onMatchClick={handleMatchClick}
                        groupName={group.name}
                      />
                    ))}
                  </div>
                ) : tournament.format === 'swiss' ? (
                  <div className="space-y-6">
                    {/* Afficher les matchs par ronde */}
                    {Array.from({ length: currentSwissRound }, (_, i) => i + 1).map(round => (
                      <MatchList
                        key={round}
                        matches={tournament.matches.filter(m => m.round === round)}
                        participants={tournament.participants}
                        participantStatuses={tournament.participantStatuses}
                        onMatchClick={handleMatchClick}
                        groupName={`Ronde ${round}`}
                      />
                    ))}
                  </div>
                ) : (
                  <MatchList
                    matches={tournament.matches}
                    participants={tournament.participants}
                    participantStatuses={tournament.participantStatuses}
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
                <h3 className="font-semibold text-lg mb-2">
                  {tournament.format === 'swiss' ? 'Aucune ronde générée' : 'Aucun bracket généré'}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Ajoutez au moins 2 participants puis générez {tournament.format === 'swiss' ? 'la première ronde' : 'le bracket'} pour commencer le tournoi
                </p>
                {canGenerateBracket && (
                  <Button onClick={handleGenerateBracket}>
                    {tournament.format === 'swiss' ? 'Générer la ronde 1' : 'Générer le bracket'}
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
                onUpdateSeed={(participantId, newSeed) => updateParticipantSeed(tournament.id, participantId, newSeed)}
                canAdd={canAddParticipants}
                canRemove={canRemoveParticipants}
                canEditSeeds={tournament.status === 'draft' && tournament.format !== 'swiss'}
                seedingMode={tournament.format === 'swiss' ? 'random' : (tournament.config.seeding || 'random')}
                winnerId={tournament.winnerId}
                penalties={tournament.penalties}
                participantStatuses={tournament.participantStatuses}
                onManageParticipant={setSelectedParticipant}
                showManagement={tournament.status !== 'draft'}
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
                {tournament.format === 'swiss' && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ronde</span>
                    <span className="font-semibold">{currentSwissRound} / {totalSwissRounds}</span>
                  </div>
                )}
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

          {/* Historique des événements */}
          {tournament.events && tournament.events.length > 0 && (
            <TournamentHistory events={tournament.events} />
          )}

          {/* Cashprize */}
          {tournament.config.cashprize && (
            <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Trophy className="h-5 w-5" />
                  Cashprize
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-center">
                  {tournament.config.cashprize.total} {tournament.config.cashprize.currency}
                </div>
                
                {/* Distribution individuelle */}
                {tournament.config.cashprize.distribution.length > 0 && (
                  <div className="space-y-2">
                    {tournament.config.cashprize.distribution.map((item) => {
                      const amount = Math.round(tournament.config.cashprize!.total * item.percent / 100);
                      return (
                        <div key={item.place} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {item.place}{item.place === 1 ? 'er' : 'ème'}
                          </span>
                          <span className="font-semibold">
                            {amount} {tournament.config.cashprize!.currency} ({item.percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Plages */}
                {tournament.config.cashprize.ranges.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-warning/20">
                    {tournament.config.cashprize.ranges.map((range, index) => {
                      const totalAmount = Math.round(tournament.config.cashprize!.total * range.percent / 100);
                      const placesCount = range.endPlace - range.startPlace + 1;
                      const perPlace = Math.round(totalAmount / placesCount);
                      return (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              {range.startPlace}ème - {range.endPlace}ème
                            </span>
                            <span className="font-semibold">
                              {totalAmount} {tournament.config.cashprize!.currency} ({range.percent}%)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            soit {perPlace} {tournament.config.cashprize!.currency}/joueur
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Lots matériels */}
                {tournament.config.cashprize.materialPrizes && tournament.config.cashprize.materialPrizes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-warning/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Lots</p>
                    {tournament.config.cashprize.materialPrizes.map((prize, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {prize.place}{prize.place === 1 ? 'er' : 'ème'}
                        </span>
                        <span className="font-medium">{prize.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Plages de lots matériels */}
                {tournament.config.cashprize.materialPrizeRanges && tournament.config.cashprize.materialPrizeRanges.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-warning/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Lots par plage</p>
                    {tournament.config.cashprize.materialPrizeRanges.map((range, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {range.startPlace}ème - {range.endPlace}ème
                        </span>
                        <span className="font-medium">{range.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Match result modal */}
      {selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          participants={tournament.participants}
          onSubmit={handleSubmitResult}
          onClose={() => setSelectedMatch(null)}
          highScoreWins={tournament.config.highScoreWins !== false}
          bestOf={getBestOfForMatch(selectedMatch)}
        />
      )}

      {/* Winner selection modal */}
      {showWinnerSelection && (
        <WinnerSelectionModal
          participants={tournament.participants}
          standings={tournament.groups?.[0]?.standings}
          onSelect={(winnerId) => {
            setTournamentWinner(tournament.id, winnerId);
            setShowWinnerSelection(false);
          }}
          onClose={() => setShowWinnerSelection(false)}
        />
      )}

      {/* Participant management modal */}
      {selectedParticipant && (() => {
        const isEliminationFormat = tournament.format === 'single_elimination' || tournament.format === 'double_elimination';
        let canRepechage = false;
        let lastDefeatedName: string | undefined;
        
        if (isEliminationFormat) {
          const wonMatches = tournament.matches
            .filter(m => 
              m.status === 'completed' && 
              m.winnerId === selectedParticipant.id &&
              m.participant1Id && m.participant2Id
            )
            .sort((a, b) => b.round - a.round);
          
          if (wonMatches.length > 0) {
            canRepechage = true;
            const lastWonMatch = wonMatches[0];
            const defeatedId = lastWonMatch.participant1Id === selectedParticipant.id 
              ? lastWonMatch.participant2Id 
              : lastWonMatch.participant1Id;
            const defeatedParticipant = tournament.participants.find(p => p.id === defeatedId);
            lastDefeatedName = defeatedParticipant?.name;
          }
        }
        
        return (
          <ParticipantManagementModal
            participant={selectedParticipant}
            penalties={tournament.penalties || []}
            status={tournament.participantStatuses?.find(s => s.participantId === selectedParticipant.id)}
            tournamentFormat={tournament.format}
            canRepechage={canRepechage}
            lastDefeatedName={lastDefeatedName}
            onAddPenalty={(points, reason) => {
              addPenalty(tournament.id, selectedParticipant.id, points, reason);
            }}
            onRemovePenalty={(penaltyId) => {
              removePenalty(tournament.id, penaltyId);
            }}
            onEliminate={(reason, useRepechage) => {
              eliminateParticipant(tournament.id, selectedParticipant.id, reason, useRepechage);
              setSelectedParticipant(null);
            }}
            onReinstate={() => {
              reinstateParticipant(tournament.id, selectedParticipant.id);
            }}
            onClose={() => setSelectedParticipant(null)}
          />
        );
      })()}
    </div>
  );
}
