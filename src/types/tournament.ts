// Types de formats de tournoi
export type TournamentFormat = 
  | 'single_elimination' 
  | 'double_elimination' 
  | 'groups' 
  | 'championship'
  | 'swiss';

// Statut d'un tournoi
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';

// Statut d'un match
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Participant (joueur ou équipe)
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  seed?: number;
  metadata?: Record<string, unknown>;
}

// Score d'un match (ou d'une manche)
export interface MatchScore {
  participant1Score: number;
  participant2Score: number;
}

// Une manche dans un Best-of
export interface Game {
  id: string;
  gameNumber: number; // 1, 2, 3...
  participant1Score: number;
  participant2Score: number;
  winnerId?: string;
  completedAt?: Date;
}

// Historique de modification de score
export interface ScoreHistory {
  previousScore: MatchScore;
  modifiedAt: Date;
  reason?: string;
}

// Match
export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  participant1Id?: string;
  participant2Id?: string;
  winnerId?: string;
  loserId?: string;
  // Score global (pour compatibilité et affichage rapide)
  score?: MatchScore;
  scoreHistory?: ScoreHistory[];
  // Manches du Best-of
  games?: Game[];
  // BO spécifique pour ce match (ex: finale en BO5 alors que le reste est en BO3)
  bestOf?: number;
  status: MatchStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Pour double élimination
  bracket?: 'winners' | 'losers' | 'finals';
  // Pour les groupes
  groupId?: string;
  // Phase du match (pour déterminer le BO applicable)
  phase?: 'groups' | 'playoffs' | 'final';
  // Lien avec le timer backend (pour intégration future)
  timerRoomCode?: string;
}

// Groupe (pour format groupes)
export interface Group {
  id: string;
  name: string;
  tournamentId: string;
  participantIds: string[];
  standings?: GroupStanding[];
}

// Classement dans un groupe
export interface GroupStanding {
  participantId: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

// Configuration du tournoi
export interface TournamentConfig {
  // Général
  thirdPlaceMatch?: boolean;
  
  // Pour élimination simple/double et groupes
  seeding?: 'random' | 'manual';
  
  // Pour les groupes
  groupCount?: number;
  qualifiersPerGroup?: number;
  pointsWin?: number;
  pointsDraw?: number;
  pointsLoss?: number;
  
  // Pour championnat
  roundRobin?: boolean;
  homeAndAway?: boolean;
  
  // Pour système suisse
  swissRounds?: number; // Nombre de rondes (par défaut: log2(participants))
  swissPairingMethod?: 'standard' | 'accelerated'; // Standard ou Accéléré (Holland)
  swissAvoidRematches?: boolean; // Éviter les re-matchs (true par défaut)
  
  // Best-of par défaut
  bestOf?: number;
  // Best-of pour la finale (élimination simple/double)
  bestOfFinal?: number;
  // Best-of pour les matchs de groupe
  bestOfGroups?: number;
  // Best-of pour les playoffs (après groupes)
  bestOfPlayoffs?: number;
  // Best-of pour la finale des playoffs (après groupes)
  bestOfPlayoffsFinal?: number;
  
  // Affichage des scores détaillés (BP/BC) - utile pour le sport
  showScoreDetails?: boolean;
  
  // Le score le plus haut gagne (true par défaut, false = score le plus bas gagne)
  highScoreWins?: boolean;
  
  // Confrontation directe en cas d'égalité
  useHeadToHead?: boolean;
  
  // Cashprize
  cashprize?: {
    total: number;
    currency: '€' | '£' | '$' | 'points';
    // Répartition individuelle par place
    distribution: { place: number; percent: number }[];
    // Répartition par plage (ex: 10% à répartir entre places 6-30)
    ranges: { startPlace: number; endPlace: number; percent: number }[];
    // Lots matériels individuels
    materialPrizes: { place: number; description: string }[];
    // Lots matériels par plage
    materialPrizeRanges: { startPlace: number; endPlace: number; description: string }[];
  };
  
  // Intégration timer
  useTimer?: boolean;
  timerDuration?: number; // en secondes
  timerMode?: 'simultaneous' | 'cumulative';
}

// Pénalité pour un participant
export interface Penalty {
  id: string;
  participantId: string;
  points: number;
  reason: string;
  createdAt: Date;
}

// Type d'événement du tournoi
export type TournamentEventType = 
  | 'tournament_created'
  | 'tournament_started'
  | 'tournament_completed'
  | 'participant_added'
  | 'participant_removed'
  | 'bracket_generated'
  | 'match_started'
  | 'match_completed'
  | 'match_score_updated'
  | 'penalty_added'
  | 'penalty_removed'
  | 'participant_eliminated'
  | 'participant_reinstated';

// Événement du tournoi (historique)
export interface TournamentEvent {
  id: string;
  type: TournamentEventType;
  timestamp: Date;
  description: string;
  // Données contextuelles selon le type d'événement
  data?: {
    participantId?: string;
    participantName?: string;
    matchId?: string;
    round?: number;
    score?: MatchScore;
    previousScore?: MatchScore;
    penaltyId?: string;
    penaltyPoints?: number;
    reason?: string;
    winnerId?: string;
    winnerName?: string;
    games?: Game[];
    isPartial?: boolean;
  };
}

// Statut d'élimination d'un participant
export interface ParticipantStatus {
  participantId: string;
  isEliminated: boolean;
  eliminatedAt?: Date;
  eliminationReason?: string;
  // Informations pour la réintégration (tournois à élimination)
  forfeitMatchId?: string; // Match où l'élimination a eu lieu
  originalMatchState?: {   // État original du match avant modification
    status: MatchStatus;
    score?: {
      participant1Score: number;
      participant2Score: number;
    };
    winnerId?: string;
  };
  promotedOpponentId?: string; // Joueur repêché qui a remplacé l'éliminé
}

// Tournoi principal
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  config: TournamentConfig;
  participants: Participant[];
  matches: Match[];
  groups?: Group[];
  penalties?: Penalty[];
  participantStatuses?: ParticipantStatus[];
  events?: TournamentEvent[]; // Historique des événements
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  winnerId?: string;
  // Dates de planification
  scheduledStartDate?: Date; // Date de début prévue
  registrationEndDate?: Date; // Date de fin des inscriptions
  // Inscription libre
  registrationOpen?: boolean; // true = inscription libre, false = organisateur inscrit
  // Image du tournoi
  imageUrl?: string; // URL de l'image (base64 ou URL externe)
  // Métadonnées (jeu, catégorie, etc.)
  game?: string;
  category?: string;
  tags?: string[];
}

// Pour la création d'un tournoi
export interface CreateTournamentInput {
  name: string;
  description?: string;
  format: TournamentFormat;
  config?: Partial<TournamentConfig>;
  game?: string;
  category?: string;
  // Nouvelles options
  scheduledStartDate?: Date;
  registrationEndDate?: Date;
  registrationOpen?: boolean;
  imageUrl?: string;
}

// Pour ajouter des participants
export interface AddParticipantInput {
  name: string;
  seed?: number;
  metadata?: Record<string, unknown>;
}

// Résultat d'un match
export interface MatchResultInput {
  matchId: string;
  participant1Score: number;
  participant2Score: number;
  // Optionnel - calculé automatiquement sauf en cas d'égalité
  winnerId?: string;
  // Manches du Best-of (optionnel pour les matchs simples)
  games?: Game[];
  // Match en cours (pas encore terminé) - pour sauvegarde partielle en BO
  isPartial?: boolean;
}
