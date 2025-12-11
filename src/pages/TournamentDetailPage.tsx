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
  Timer,
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
  ParticipantManagementModal
} from '@/components/tournament';
import { useTournament } from '@/context/TournamentContext';
import type { Match, TournamentStatus, Participant } from '@/types';

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
    deleteTournament,
    setTournamentWinner,
    addPenalty,
    removePenalty,
    eliminateParticipant,
    reinstateParticipant
  } = useTournament();

  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const tournament = tournaments.find(t => t.id === id);

  useEffect(() => {
    if (tournament?.format === 'groups' || tournament?.format === 'championship') {
      setViewMode('groups');
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

  const handleSubmitResult = (winnerId: string | undefined, score1: number, score2: number) => {
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
  // Ajout de joueurs uniquement en mode brouillon (avant génération du bracket)
  const canAddParticipants = tournament.status === 'draft';
  const canRemoveParticipants = tournament.status === 'draft';

  const winner = tournament.winnerId 
    ? tournament.participants.find(p => p.id === tournament.winnerId)
    : null;

  // Vérifier si le tournoi est terminé mais sans vainqueur (égalité)
  const allMatchesCompleted = tournament.matches.length > 0 && 
    tournament.matches.every(m => m.status === 'completed');
  const needsWinnerSelection = allMatchesCompleted && !tournament.winnerId;

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
      {needsWinnerSelection && (
        <Card className="border-warning bg-gradient-to-r from-warning/10 to-warning/5">
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 text-warning">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-warning font-medium">Égalité détectée</p>
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
              {tournament.format !== 'championship' && tournament.format !== 'groups' && (
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
              {(tournament.format === 'groups' || tournament.format === 'championship') && (
                <Button
                  variant={viewMode === 'groups' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('groups')}
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
                  participantStatuses={tournament.participantStatuses}
                  onMatchClick={handleMatchClick}
                />
              </CardContent>
            </Card>
          )}

          {/* Groups/Standings view */}
          {viewMode === 'groups' && (tournament.format === 'groups' || tournament.format === 'championship') && (
            <div className="space-y-6">
              {tournament.groups?.map(group => (
                <GroupStandingsTable
                  key={group.id}
                  group={group}
                  participants={tournament.participants}
                  matches={tournament.matches.filter(m => m.groupId === group.id || tournament.format === 'championship')}
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
                        participantStatuses={tournament.participantStatuses}
                        onMatchClick={handleMatchClick}
                        groupName={group.name}
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
                canAdd={canAddParticipants}
                canRemove={canRemoveParticipants}
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
        // Calculer si le joueur peut avoir un repêchage
        const isEliminationFormat = tournament.format === 'single_elimination' || tournament.format === 'double_elimination';
        let canRepechage = false;
        let lastDefeatedName: string | undefined;
        
        if (isEliminationFormat) {
          // Chercher le dernier match gagné par ce joueur
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
