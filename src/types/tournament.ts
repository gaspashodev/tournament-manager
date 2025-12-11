// Types de formats de tournoi
export type TournamentFormat = 
  | 'single_elimination' 
  | 'double_elimination' 
  | 'groups' 
  | 'championship';

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

// Score d'un match
export interface MatchScore {
  participant1Score: number;
  participant2Score: number;
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
  score?: MatchScore;
  scoreHistory?: ScoreHistory[];
  status: MatchStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Pour double élimination
  bracket?: 'winners' | 'losers' | 'finals';
  // Pour les groupes
  groupId?: string;
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
  
  // Pour élimination simple/double
  seeding?: 'random' | 'manual' | 'ranked';
  
  // Pour les groupes
  groupCount?: number;
  qualifiersPerGroup?: number;
  pointsWin?: number;
  pointsDraw?: number;
  pointsLoss?: number;
  
  // Pour championnat
  roundRobin?: boolean;
  homeAndAway?: boolean;
  
  // Général
  bestOf?: number;
  
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
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  winnerId?: string;
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
}
