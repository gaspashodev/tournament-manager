import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Tournament, 
  CreateTournamentInput, 
  AddParticipantInput,
  Match,
  MatchResultInput,
  Participant,
  Group,
  GroupStanding,
  Penalty,
  ParticipantStatus
} from '@/types';

// State
interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  loading: boolean;
  error: string | null;
}

// Actions
type TournamentAction =
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'SET_CURRENT_TOURNAMENT'; payload: Tournament | null }
  | { type: 'ADD_TOURNAMENT'; payload: Tournament }
  | { type: 'UPDATE_TOURNAMENT'; payload: Tournament }
  | { type: 'DELETE_TOURNAMENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer
function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload };
    case 'SET_CURRENT_TOURNAMENT':
      return { ...state, currentTournament: action.payload };
    case 'ADD_TOURNAMENT':
      return { ...state, tournaments: [...state.tournaments, action.payload] };
    case 'UPDATE_TOURNAMENT':
      return {
        ...state,
        tournaments: state.tournaments.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
        currentTournament: state.currentTournament?.id === action.payload.id 
          ? action.payload 
          : state.currentTournament
      };
    case 'DELETE_TOURNAMENT':
      return {
        ...state,
        tournaments: state.tournaments.filter(t => t.id !== action.payload),
        currentTournament: state.currentTournament?.id === action.payload 
          ? null 
          : state.currentTournament
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Initial state
const initialState: TournamentState = {
  tournaments: [],
  currentTournament: null,
  loading: false,
  error: null
};

// Context
interface TournamentContextType extends TournamentState {
  createTournament: (input: CreateTournamentInput) => Tournament;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (id: string) => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  addParticipant: (tournamentId: string, input: AddParticipantInput) => void;
  removeParticipant: (tournamentId: string, participantId: string) => void;
  generateBracket: (tournamentId: string) => void;
  submitMatchResult: (input: MatchResultInput) => void;
  startTournament: (tournamentId: string) => void;
  setTournamentWinner: (tournamentId: string, winnerId: string) => void;
  // Nouvelles fonctions
  addPenalty: (tournamentId: string, participantId: string, points: number, reason: string) => void;
  removePenalty: (tournamentId: string, penaltyId: string) => void;
  eliminateParticipant: (tournamentId: string, participantId: string, reason: string, useRepechage?: boolean) => void;
  reinstateParticipant: (tournamentId: string, participantId: string) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Helper: Créer les standings initiaux pour un groupe ou championnat
function createInitialStandings(participantIds: string[]): GroupStanding[] {
  return participantIds.map(id => ({
    participantId: id,
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    points: 0
  }));
}

// Helper: Calculer le vainqueur d'un match basé sur les scores
function calculateWinner(
  participant1Id: string | undefined,
  participant2Id: string | undefined,
  score1: number,
  score2: number,
  highScoreWins: boolean = true
): string | undefined {
  if (!participant1Id || !participant2Id) return undefined;
  
  if (score1 === score2) return undefined; // Égalité, pas de vainqueur automatique
  
  if (highScoreWins) {
    return score1 > score2 ? participant1Id : participant2Id;
  } else {
    return score1 < score2 ? participant1Id : participant2Id;
  }
}

// Helper: Déterminer le vainqueur d'un tournoi basé sur les standings
// Helper pour trouver le vainqueur de la confrontation directe
function getHeadToHeadWinner(
  participant1Id: string,
  participant2Id: string,
  matches: Match[]
): string | undefined {
  // Trouver le(s) match(s) entre ces deux participants
  const headToHeadMatches = matches.filter(m => 
    m.status === 'completed' &&
    ((m.participant1Id === participant1Id && m.participant2Id === participant2Id) ||
     (m.participant1Id === participant2Id && m.participant2Id === participant1Id))
  );
  
  if (headToHeadMatches.length === 0) return undefined;
  
  // Compter les victoires
  let wins1 = 0;
  let wins2 = 0;
  
  for (const match of headToHeadMatches) {
    if (match.winnerId === participant1Id) wins1++;
    else if (match.winnerId === participant2Id) wins2++;
  }
  
  if (wins1 > wins2) return participant1Id;
  if (wins2 > wins1) return participant2Id;
  return undefined; // Égalité dans les confrontations directes
}

// Helper pour obtenir les joueurs à égalité parfaite en tête du classement
export function getTiedParticipants(
  standings: GroupStanding[]
): GroupStanding[] {
  if (standings.length < 2) return standings;
  
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
  
  const first = sorted[0];
  const firstDiff = first.pointsFor - first.pointsAgainst;
  
  // Trouver tous les joueurs avec les mêmes stats que le premier
  return sorted.filter(s => {
    const diff = s.pointsFor - s.pointsAgainst;
    return s.points === first.points && diff === firstDiff && s.pointsFor === first.pointsFor;
  });
}

function determineTournamentWinner(
  format: string,
  matches: Match[],
  groups?: Group[],
  standings?: GroupStanding[],
  useHeadToHead?: boolean
): string | undefined {
  if (format === 'single_elimination' || format === 'double_elimination') {
    // Le vainqueur est celui du dernier match (finale)
    const maxRound = Math.max(...matches.map(m => m.round));
    const finalMatch = matches.find(m => m.round === maxRound);
    return finalMatch?.winnerId;
  }
  
  if (format === 'groups') {
    // Pour les groupes, on prend le meilleur des premiers de chaque groupe
    // (simplifié - normalement il y aurait des playoffs)
    if (!groups) return undefined;
    
    let bestWinner: { id: string; points: number; diff: number } | undefined;
    
    for (const group of groups) {
      if (group.standings && group.standings.length > 0) {
        const sorted = [...group.standings].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const diffA = a.pointsFor - a.pointsAgainst;
          const diffB = b.pointsFor - b.pointsAgainst;
          return diffB - diffA;
        });
        
        const groupWinner = sorted[0];
        const winnerDiff = groupWinner.pointsFor - groupWinner.pointsAgainst;
        
        if (!bestWinner || groupWinner.points > bestWinner.points || 
            (groupWinner.points === bestWinner.points && winnerDiff > bestWinner.diff)) {
          bestWinner = { id: groupWinner.participantId, points: groupWinner.points, diff: winnerDiff };
        }
      }
    }
    
    return bestWinner?.id;
  }
  
  if (format === 'championship') {
    // Le vainqueur est celui avec le plus de points dans le classement
    if (!standings || standings.length === 0) return undefined;
    
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.pointsFor - a.pointsAgainst;
      const diffB = b.pointsFor - b.pointsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.pointsFor - a.pointsFor;
    });
    
    // Trouver tous les joueurs à égalité parfaite en tête
    const tiedParticipants = getTiedParticipants(standings);
    
    if (tiedParticipants.length >= 2) {
      // S'il y a égalité et que useHeadToHead est activé, regarder la confrontation directe
      if (useHeadToHead && tiedParticipants.length === 2) {
        const winner = getHeadToHeadWinner(
          tiedParticipants[0].participantId,
          tiedParticipants[1].participantId,
          matches
        );
        if (winner) return winner;
      }
      
      // Si plus de 2 joueurs à égalité ou pas de vainqueur en confrontation directe
      // -> pas de vainqueur automatique
      return undefined;
    }
    
    return sorted[0].participantId;
  }
  
  return undefined;
}

// Helper functions pour générer les brackets
function generateSingleEliminationMatches(participants: Participant[]): Match[] {
  const matches: Match[] = [];
  const participantCount = participants.length;
  
  // Calculer le nombre de rounds nécessaires
  const rounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = Math.pow(2, rounds);
  
  // Créer les seedings (mélange si pas de seed manuel)
  const seededParticipants = [...participants].sort((a, b) => {
    if (a.seed && b.seed) return a.seed - b.seed;
    return Math.random() - 0.5;
  });
  
  // Générer les matchs du premier tour
  let matchPosition = 0;
  const firstRoundMatchCount = totalSlots / 2;
  
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const p1Index = i;
    const p2Index = totalSlots - 1 - i;
    
    const participant1 = seededParticipants[p1Index];
    const participant2 = p2Index < participantCount ? seededParticipants[p2Index] : undefined;
    
    // Si pas d'adversaire (bye), le participant est automatiquement vainqueur
    const isBye = !participant2;
    
    matches.push({
      id: uuidv4(),
      tournamentId: '',
      round: 1,
      position: matchPosition++,
      participant1Id: participant1?.id,
      participant2Id: participant2?.id,
      status: isBye ? 'completed' : 'pending',
      winnerId: isBye ? participant1?.id : undefined
    });
  }
  
  // Générer les matchs des rounds suivants
  for (let round = 2; round <= rounds; round++) {
    const matchCount = Math.pow(2, rounds - round);
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round,
        position: i,
        status: 'pending'
      });
    }
  }
  
  // Propager les gagnants des byes au tour suivant
  const firstRoundMatches = matches.filter(m => m.round === 1);
  for (const match of firstRoundMatches) {
    if (match.status === 'completed' && match.winnerId) {
      // Trouver le match du tour suivant
      const nextRoundMatch = matches.find(m => 
        m.round === 2 && 
        Math.floor(match.position / 2) === m.position
      );
      if (nextRoundMatch) {
        const isFirstSlot = match.position % 2 === 0;
        if (isFirstSlot) {
          nextRoundMatch.participant1Id = match.winnerId;
        } else {
          nextRoundMatch.participant2Id = match.winnerId;
        }
      }
    }
  }
  
  return matches;
}

function generateGroupStageMatches(participants: Participant[], groupCount: number): { groups: Group[], matches: Match[] } {
  const groups: Group[] = [];
  const matches: Match[] = [];
  
  // Répartir les participants dans les groupes
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const participantsPerGroup = Math.ceil(shuffled.length / groupCount);
  
  for (let g = 0; g < groupCount; g++) {
    const groupParticipants = shuffled.slice(
      g * participantsPerGroup, 
      (g + 1) * participantsPerGroup
    );
    
    const group: Group = {
      id: uuidv4(),
      name: `Groupe ${String.fromCharCode(65 + g)}`,
      tournamentId: '',
      participantIds: groupParticipants.map(p => p.id),
      standings: createInitialStandings(groupParticipants.map(p => p.id))
    };
    
    groups.push(group);
    
    // Générer les matchs round-robin pour ce groupe
    let matchPosition = 0;
    for (let i = 0; i < groupParticipants.length; i++) {
      for (let j = i + 1; j < groupParticipants.length; j++) {
        matches.push({
          id: uuidv4(),
          tournamentId: '',
          round: 1,
          position: matchPosition++,
          participant1Id: groupParticipants[i].id,
          participant2Id: groupParticipants[j].id,
          status: 'pending',
          groupId: group.id
        });
      }
    }
  }
  
  return { groups, matches };
}

function generateChampionshipMatches(participants: Participant[], homeAndAway: boolean): { matches: Match[], standings: GroupStanding[] } {
  const matches: Match[] = [];
  let round = 1;
  
  // Round-robin: chaque participant joue contre tous les autres
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        id: uuidv4(),
        tournamentId: '',
        round,
        position: matches.length,
        participant1Id: participants[i].id,
        participant2Id: participants[j].id,
        status: 'pending'
      });
      
      // Match retour si home and away
      if (homeAndAway) {
        matches.push({
          id: uuidv4(),
          tournamentId: '',
          round: round + 1,
          position: matches.length,
          participant1Id: participants[j].id,
          participant2Id: participants[i].id,
          status: 'pending'
        });
      }
    }
  }
  
  // Créer les standings pour le championnat
  const standings = createInitialStandings(participants.map(p => p.id));
  
  return { matches, standings };
}

// Provider
export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  const createTournament = useCallback((input: CreateTournamentInput): Tournament => {
    const tournament: Tournament = {
      id: uuidv4(),
      name: input.name,
      description: input.description,
      format: input.format,
      status: 'draft',
      config: {
        seeding: 'random',
        thirdPlaceMatch: false,
        groupCount: 4,
        qualifiersPerGroup: 2,
        pointsWin: 3,
        pointsDraw: 1,
        pointsLoss: 0,
        bestOf: 1,
        showScoreDetails: false, // BP/BC désactivé par défaut
        highScoreWins: true, // Le plus haut score gagne par défaut
        ...input.config
      },
      participants: [],
      matches: [],
      groups: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      game: input.game,
      category: input.category
    };
    
    dispatch({ type: 'ADD_TOURNAMENT', payload: tournament });
    return tournament;
  }, []);

  const updateTournament = useCallback((tournament: Tournament) => {
    tournament.updatedAt = new Date();
    dispatch({ type: 'UPDATE_TOURNAMENT', payload: tournament });
  }, []);

  const deleteTournament = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TOURNAMENT', payload: id });
  }, []);

  const setCurrentTournament = useCallback((tournament: Tournament | null) => {
    dispatch({ type: 'SET_CURRENT_TOURNAMENT', payload: tournament });
  }, []);

  const addParticipant = useCallback((tournamentId: string, input: AddParticipantInput) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const participant: Participant = {
      id: uuidv4(),
      name: input.name,
      seed: input.seed,
      metadata: input.metadata
    };

    const updated = {
      ...tournament,
      participants: [...tournament.participants, participant],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const removeParticipant = useCallback((tournamentId: string, participantId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const updated = {
      ...tournament,
      participants: tournament.participants.filter(p => p.id !== participantId),
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const generateBracket = useCallback((tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.participants.length < 2) return;

    let matches: Match[] = [];
    let groups: Group[] = [];
    let championshipStandings: GroupStanding[] | undefined;

    switch (tournament.format) {
      case 'single_elimination':
        matches = generateSingleEliminationMatches(tournament.participants);
        break;
      case 'double_elimination':
        // Pour le moment, on génère comme une élimination simple
        // Une implémentation complète ajouterait le bracket des perdants
        matches = generateSingleEliminationMatches(tournament.participants);
        matches = matches.map(m => ({ ...m, bracket: 'winners' as const }));
        break;
      case 'groups': {
        const result = generateGroupStageMatches(
          tournament.participants, 
          tournament.config.groupCount || 4
        );
        groups = result.groups;
        matches = result.matches;
        break;
      }
      case 'championship': {
        const result = generateChampionshipMatches(
          tournament.participants,
          tournament.config.homeAndAway || false
        );
        matches = result.matches;
        championshipStandings = result.standings;
        // Pour le championnat, on crée un groupe virtuel pour stocker les standings
        groups = [{
          id: uuidv4(),
          name: 'Classement',
          tournamentId,
          participantIds: tournament.participants.map(p => p.id),
          standings: championshipStandings
        }];
        break;
      }
    }

    // Assigner l'ID du tournoi à tous les matchs et groupes
    matches = matches.map(m => ({ ...m, tournamentId }));
    groups = groups.map(g => ({ ...g, tournamentId }));

    const updated = {
      ...tournament,
      matches,
      groups,
      status: 'registration' as const,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const submitMatchResult = useCallback((input: MatchResultInput) => {
    const tournament = state.tournaments.find(t => 
      t.matches.some(m => m.id === input.matchId)
    );
    if (!tournament) return;

    const matchIndex = tournament.matches.findIndex(m => m.id === input.matchId);
    if (matchIndex === -1) return;

    const match = tournament.matches[matchIndex];
    const highScoreWins = tournament.config.highScoreWins !== false;
    
    // Calculer automatiquement le vainqueur sauf si fourni (égalité)
    const autoWinnerId = calculateWinner(
      match.participant1Id,
      match.participant2Id,
      input.participant1Score,
      input.participant2Score,
      highScoreWins
    );
    
    const winnerId = input.winnerId || autoWinnerId;
    const isModification = match.status === 'completed';
    
    // Créer l'historique si c'est une modification
    const scoreHistory = match.scoreHistory || [];
    if (isModification && match.score) {
      scoreHistory.push({
        previousScore: { ...match.score },
        modifiedAt: new Date()
      });
    }

    const updatedMatch: Match = {
      ...match,
      score: {
        participant1Score: input.participant1Score,
        participant2Score: input.participant2Score
      },
      scoreHistory: scoreHistory.length > 0 ? scoreHistory : undefined,
      winnerId,
      loserId: winnerId ? (match.participant1Id === winnerId ? match.participant2Id : match.participant1Id) : undefined,
      status: 'completed',
      completedAt: new Date()
    };

    const updatedMatches = [...tournament.matches];
    updatedMatches[matchIndex] = updatedMatch;

    // Si élimination simple, faire avancer le gagnant
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      if (winnerId) {
        const nextRoundMatch = updatedMatches.find(m => 
          m.round === match.round + 1 && 
          Math.floor(match.position / 2) === m.position
        );
        if (nextRoundMatch) {
          const isFirstSlot = match.position % 2 === 0;
          if (isFirstSlot) {
            nextRoundMatch.participant1Id = winnerId;
          } else {
            nextRoundMatch.participant2Id = winnerId;
          }
        }
      }
    }

    // Mettre à jour les standings pour groupes et championnat
    let updatedGroups = tournament.groups ? [...tournament.groups] : [];
    
    if ((tournament.format === 'groups' && match.groupId) || tournament.format === 'championship') {
      const groupId = match.groupId || (tournament.format === 'championship' && updatedGroups[0]?.id);
      const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
      
      if (groupIndex !== -1) {
        const group = { ...updatedGroups[groupIndex] };
        if (group.standings) {
          // Clone standings pour éviter les mutations
          const newStandings = group.standings.map(s => ({ ...s }));
          
          const p1Standing = newStandings.find(s => s.participantId === match.participant1Id);
          const p2Standing = newStandings.find(s => s.participantId === match.participant2Id);
          
          if (p1Standing && p2Standing) {
            // Si modification, d'abord annuler l'ancien résultat
            if (isModification && match.score) {
              p1Standing.played--;
              p2Standing.played--;
              p1Standing.pointsFor -= match.score.participant1Score;
              p1Standing.pointsAgainst -= match.score.participant2Score;
              p2Standing.pointsFor -= match.score.participant2Score;
              p2Standing.pointsAgainst -= match.score.participant1Score;
              
              if (match.winnerId === match.participant1Id) {
                p1Standing.won--;
                p2Standing.lost--;
                p1Standing.points -= tournament.config.pointsWin || 3;
              } else if (match.winnerId === match.participant2Id) {
                p2Standing.won--;
                p1Standing.lost--;
                p2Standing.points -= tournament.config.pointsWin || 3;
              } else {
                // Match nul précédent
                p1Standing.drawn--;
                p2Standing.drawn--;
                p1Standing.points -= tournament.config.pointsDraw || 1;
                p2Standing.points -= tournament.config.pointsDraw || 1;
              }
            }
            
            // Appliquer le nouveau résultat
            p1Standing.played++;
            p2Standing.played++;
            p1Standing.pointsFor += input.participant1Score;
            p1Standing.pointsAgainst += input.participant2Score;
            p2Standing.pointsFor += input.participant2Score;
            p2Standing.pointsAgainst += input.participant1Score;
            
            if (winnerId === match.participant1Id) {
              p1Standing.won++;
              p2Standing.lost++;
              p1Standing.points += tournament.config.pointsWin || 3;
              p2Standing.points += tournament.config.pointsLoss || 0;
            } else if (winnerId === match.participant2Id) {
              p2Standing.won++;
              p1Standing.lost++;
              p2Standing.points += tournament.config.pointsWin || 3;
              p1Standing.points += tournament.config.pointsLoss || 0;
            } else {
              // Égalité
              p1Standing.drawn++;
              p2Standing.drawn++;
              p1Standing.points += tournament.config.pointsDraw || 1;
              p2Standing.points += tournament.config.pointsDraw || 1;
            }
          }
          
          group.standings = newStandings;
        }
        
        updatedGroups[groupIndex] = group;
      }
    }

    // Vérifier si le tournoi est terminé
    const allCompleted = updatedMatches.every(m => m.status === 'completed');
    
    // Déterminer le vainqueur du tournoi si terminé
    let tournamentWinnerId: string | undefined;
    if (allCompleted) {
      tournamentWinnerId = determineTournamentWinner(
        tournament.format,
        updatedMatches,
        updatedGroups,
        updatedGroups[0]?.standings,
        tournament.config.useHeadToHead
      );
    }
    
    const updated: Tournament = {
      ...tournament,
      matches: updatedMatches,
      groups: updatedGroups,
      status: allCompleted ? 'completed' : 'in_progress',
      winnerId: tournamentWinnerId,
      completedAt: allCompleted ? new Date() : undefined,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const startTournament = useCallback((tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const updated = {
      ...tournament,
      status: 'in_progress' as const,
      startedAt: new Date(),
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const setTournamentWinner = useCallback((tournamentId: string, winnerId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const updated = {
      ...tournament,
      winnerId,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  // Ajouter une pénalité à un participant
  const addPenalty = useCallback((tournamentId: string, participantId: string, points: number, reason: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const newPenalty: Penalty = {
      id: uuidv4(),
      participantId,
      points,
      reason,
      createdAt: new Date()
    };

    // Mettre à jour les standings si c'est un championnat ou groupe
    let updatedGroups = tournament.groups;
    if (tournament.format === 'championship' || tournament.format === 'groups') {
      updatedGroups = tournament.groups?.map(group => {
        const standingIndex = group.standings?.findIndex(s => s.participantId === participantId);
        if (standingIndex !== undefined && standingIndex !== -1 && group.standings) {
          const newStandings = [...group.standings];
          newStandings[standingIndex] = {
            ...newStandings[standingIndex],
            points: newStandings[standingIndex].points - points
          };
          return { ...group, standings: newStandings };
        }
        return group;
      });
    }

    const updated = {
      ...tournament,
      penalties: [...(tournament.penalties || []), newPenalty],
      groups: updatedGroups,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  // Supprimer une pénalité
  const removePenalty = useCallback((tournamentId: string, penaltyId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || !tournament.penalties) return;

    const penalty = tournament.penalties.find(p => p.id === penaltyId);
    if (!penalty) return;

    // Restaurer les points dans les standings
    let updatedGroups = tournament.groups;
    if (tournament.format === 'championship' || tournament.format === 'groups') {
      updatedGroups = tournament.groups?.map(group => {
        const standingIndex = group.standings?.findIndex(s => s.participantId === penalty.participantId);
        if (standingIndex !== undefined && standingIndex !== -1 && group.standings) {
          const newStandings = [...group.standings];
          newStandings[standingIndex] = {
            ...newStandings[standingIndex],
            points: newStandings[standingIndex].points + penalty.points
          };
          return { ...group, standings: newStandings };
        }
        return group;
      });
    }

    const updated = {
      ...tournament,
      penalties: tournament.penalties.filter(p => p.id !== penaltyId),
      groups: updatedGroups,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  // Éliminer un participant
  const eliminateParticipant = useCallback((tournamentId: string, participantId: string, reason: string, useRepechage: boolean = true) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    // Vérifier que le format supporte l'élimination
    if (tournament.format === 'championship') return;

    let updatedMatches = [...tournament.matches];
    let forfeitMatchId: string | undefined;
    let originalMatchState: ParticipantStatus['originalMatchState'];
    let repechedParticipantId: string | undefined;

    // Pour les tournois à élimination directe
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      // Trouver le dernier match du joueur (peu importe le statut)
      const participantMatches = updatedMatches
        .filter(m => m.participant1Id === participantId || m.participant2Id === participantId)
        .sort((a, b) => b.round - a.round);

      const lastMatch = participantMatches[0];
      
      if (lastMatch) {
        forfeitMatchId = lastMatch.id;
        const isParticipant1InLastMatch = lastMatch.participant1Id === participantId;
        
        // Sauvegarder l'état original du match
        originalMatchState = {
          status: lastMatch.status,
          score: lastMatch.score ? { ...lastMatch.score } : undefined,
          winnerId: lastMatch.winnerId
        };

        // Chercher le dernier match GAGNÉ par l'éliminé (pour repêcher son adversaire)
        // Exclure les matchs contre un bye (adversaire undefined)
        const wonMatches = updatedMatches
          .filter(m => 
            m.status === 'completed' && 
            m.winnerId === participantId &&
            m.participant1Id && m.participant2Id // Les deux participants doivent exister (pas de bye)
          )
          .sort((a, b) => b.round - a.round);

        // Option repêchage : seulement si demandé ET si le joueur a gagné des matchs
        if (useRepechage && wonMatches.length > 0) {
          // L'éliminé a gagné des matchs, on repêche son dernier adversaire
          const lastWonMatch = wonMatches[0];
          
          // Trouver l'adversaire battu
          repechedParticipantId = lastWonMatch.participant1Id === participantId 
            ? lastWonMatch.participant2Id 
            : lastWonMatch.participant1Id;

          // Remplacer l'éliminé par le repêché dans son dernier match
          // et remettre le match à pending
          updatedMatches = updatedMatches.map(m => {
            if (m.id === lastMatch.id) {
              return {
                ...m,
                participant1Id: isParticipant1InLastMatch ? repechedParticipantId : m.participant1Id,
                participant2Id: !isParticipant1InLastMatch ? repechedParticipantId : m.participant2Id,
                status: 'pending' as const,
                score: undefined,
                winnerId: undefined
              };
            }
            return m;
          });

          // Si le match était completed et qu'il y a un match suivant,
          // retirer le vainqueur de ce match suivant
          if (lastMatch.status === 'completed') {
            const nextMatch = updatedMatches.find(m => 
              m.round === lastMatch.round + 1 &&
              m.position === Math.floor(lastMatch.position / 2)
            );

            if (nextMatch) {
              const isFirstSlot = lastMatch.position % 2 === 0;
              updatedMatches = updatedMatches.map(m => {
                if (m.id === nextMatch.id) {
                  // Retirer le vainqueur du slot approprié
                  if (isFirstSlot) {
                    return { ...m, participant1Id: undefined, status: 'pending' as const, score: undefined, winnerId: undefined };
                  } else {
                    return { ...m, participant2Id: undefined, status: 'pending' as const, score: undefined, winnerId: undefined };
                  }
                }
                return m;
              });
            }
          }
        } else {
          // Option forfait : l'adversaire actuel gagne (s'il existe)
          const currentOpponentId = isParticipant1InLastMatch 
            ? lastMatch.participant2Id 
            : lastMatch.participant1Id;

          if (currentOpponentId && (lastMatch.status === 'pending' || lastMatch.status === 'in_progress')) {
            const forfeitScore = {
              participant1Score: isParticipant1InLastMatch ? 0 : 3,
              participant2Score: isParticipant1InLastMatch ? 3 : 0
            };

            updatedMatches = updatedMatches.map(m => {
              if (m.id === lastMatch.id) {
                return {
                  ...m,
                  status: 'completed' as const,
                  score: forfeitScore,
                  winnerId: currentOpponentId
                };
              }
              return m;
            });

            // Propager le gagnant à la phase suivante
            const nextMatch = updatedMatches.find(m => 
              m.round === lastMatch.round + 1 &&
              m.position === Math.floor(lastMatch.position / 2)
            );

            if (nextMatch) {
              const isFirstSlot = lastMatch.position % 2 === 0;
              updatedMatches = updatedMatches.map(m => {
                if (m.id === nextMatch.id) {
                  if (isFirstSlot) {
                    return { ...m, participant1Id: currentOpponentId };
                  } else {
                    return { ...m, participant2Id: currentOpponentId };
                  }
                }
                return m;
              });
            }
          }
        }
      }
    }

    // Pour les tournois à groupes, pas de repêchage automatique
    // On marque juste le joueur comme éliminé

    // Créer le statut d'élimination
    const newStatus: ParticipantStatus = {
      participantId,
      isEliminated: true,
      eliminatedAt: new Date(),
      eliminationReason: reason,
      forfeitMatchId,
      originalMatchState,
      promotedOpponentId: repechedParticipantId
    };

    // Remplacer ou ajouter le statut
    const existingStatuses = tournament.participantStatuses || [];
    const statusIndex = existingStatuses.findIndex(s => s.participantId === participantId);
    let updatedStatuses: ParticipantStatus[];
    if (statusIndex !== -1) {
      updatedStatuses = [...existingStatuses];
      updatedStatuses[statusIndex] = newStatus;
    } else {
      updatedStatuses = [...existingStatuses, newStatus];
    }

    const updated = {
      ...tournament,
      participantStatuses: updatedStatuses,
      matches: updatedMatches,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  // Réintégrer un participant éliminé
  const reinstateParticipant = useCallback((tournamentId: string, participantId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || !tournament.participantStatuses) return;

    // Trouver le statut du participant
    const status = tournament.participantStatuses.find(s => s.participantId === participantId);
    if (!status || !status.isEliminated) return;

    let updatedMatches = [...tournament.matches];

    // Pour les tournois à élimination directe
    if ((tournament.format === 'single_elimination' || tournament.format === 'double_elimination') && status.forfeitMatchId) {
      
      const forfeitMatch = updatedMatches.find(m => m.id === status.forfeitMatchId);
      
      if (forfeitMatch && status.promotedOpponentId) {
        // Un joueur a été repêché, on le remplace par le joueur réintégré
        const isRepechedParticipant1 = forfeitMatch.participant1Id === status.promotedOpponentId;
        
        updatedMatches = updatedMatches.map(m => {
          if (m.id === status.forfeitMatchId) {
            // Restaurer l'état original et remettre le joueur réintégré
            return {
              ...m,
              participant1Id: isRepechedParticipant1 ? participantId : m.participant1Id,
              participant2Id: !isRepechedParticipant1 ? participantId : m.participant2Id,
              status: status.originalMatchState?.status || 'pending',
              score: status.originalMatchState?.score,
              winnerId: status.originalMatchState?.winnerId
            };
          }
          return m;
        });
      } else if (forfeitMatch && status.originalMatchState) {
        // Pas de repêchage (forfait au premier tour), restaurer l'état original
        updatedMatches = updatedMatches.map(m => {
          if (m.id === status.forfeitMatchId) {
            return {
              ...m,
              status: status.originalMatchState!.status,
              score: status.originalMatchState!.score,
              winnerId: status.originalMatchState!.winnerId
            };
          }
          return m;
        });

        // Retirer l'adversaire de la phase suivante s'il y avait été promu
        const nextMatch = updatedMatches.find(m => 
          m.round === forfeitMatch.round + 1 &&
          m.position === Math.floor(forfeitMatch.position / 2)
        );

        if (nextMatch) {
          const isFirstSlot = forfeitMatch.position % 2 === 0;
          const opponentId = forfeitMatch.participant1Id === participantId 
            ? forfeitMatch.participant2Id 
            : forfeitMatch.participant1Id;

          updatedMatches = updatedMatches.map(m => {
            if (m.id === nextMatch.id) {
              // Retirer l'adversaire du slot s'il y était
              if (isFirstSlot && m.participant1Id === opponentId) {
                return { ...m, participant1Id: undefined };
              } else if (!isFirstSlot && m.participant2Id === opponentId) {
                return { ...m, participant2Id: undefined };
              }
            }
            return m;
          });
        }
      }
    }

    // Mettre à jour le statut
    const updatedStatuses = tournament.participantStatuses.map(s => {
      if (s.participantId === participantId) {
        return { 
          ...s, 
          isEliminated: false, 
          eliminatedAt: undefined, 
          eliminationReason: undefined,
          forfeitMatchId: undefined,
          originalMatchState: undefined,
          promotedOpponentId: undefined
        };
      }
      return s;
    });

    const updated = {
      ...tournament,
      participantStatuses: updatedStatuses,
      matches: updatedMatches,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments]);

  const value: TournamentContextType = {
    ...state,
    createTournament,
    updateTournament,
    deleteTournament,
    setCurrentTournament,
    addParticipant,
    removeParticipant,
    generateBracket,
    submitMatchResult,
    startTournament,
    setTournamentWinner,
    addPenalty,
    removePenalty,
    eliminateParticipant,
    reinstateParticipant
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
