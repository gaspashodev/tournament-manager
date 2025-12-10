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
  
  // Intégration timer
  useTimer?: boolean;
  timerDuration?: number; // en secondes
  timerMode?: 'simultaneous' | 'cumulative';
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
  winnerId: string;
}
