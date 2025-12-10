import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Tournament, 
  TournamentFormat, 
  CreateTournamentInput, 
  AddParticipantInput,
  Match,
  MatchResultInput,
  Participant,
  Group
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
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Helper functions pour générer les brackets
function generateSingleEliminationMatches(participants: Participant[]): Match[] {
  const matches: Match[] = [];
  const participantCount = participants.length;
  
  // Calculer le nombre de rounds nécessaires
  const rounds = Math.ceil(Math.log2(participantCount));
  const totalSlots = Math.pow(2, rounds);
  const byes = totalSlots - participantCount;
  
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
    
    matches.push({
      id: uuidv4(),
      tournamentId: '',
      round: 1,
      position: matchPosition++,
      participant1Id: participant1?.id,
      participant2Id: participant2?.id,
      status: participant2 ? 'pending' : 'completed',
      winnerId: participant2 ? undefined : participant1?.id
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
      standings: groupParticipants.map(p => ({
        participantId: p.id,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        points: 0
      }))
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

function generateChampionshipMatches(participants: Participant[], homeAndAway: boolean): Match[] {
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
  
  return matches;
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
        roundRobin: true,
        homeAndAway: false,
        bestOf: 1,
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
      case 'championship':
        matches = generateChampionshipMatches(
          tournament.participants,
          tournament.config.homeAndAway || false
        );
        break;
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
    const updatedMatch: Match = {
      ...match,
      score: {
        participant1Score: input.participant1Score,
        participant2Score: input.participant2Score
      },
      winnerId: input.winnerId,
      loserId: match.participant1Id === input.winnerId ? match.participant2Id : match.participant1Id,
      status: 'completed',
      completedAt: new Date()
    };

    const updatedMatches = [...tournament.matches];
    updatedMatches[matchIndex] = updatedMatch;

    // Si élimination simple, faire avancer le gagnant
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      const nextRoundMatch = updatedMatches.find(m => 
        m.round === match.round + 1 && 
        Math.floor(match.position / 2) === m.position
      );
      if (nextRoundMatch) {
        const isFirstSlot = match.position % 2 === 0;
        if (isFirstSlot) {
          nextRoundMatch.participant1Id = input.winnerId;
        } else {
          nextRoundMatch.participant2Id = input.winnerId;
        }
      }
    }

    // Mettre à jour le classement du groupe si format groupes
    if (tournament.format === 'groups' && match.groupId) {
      const groupIndex = tournament.groups?.findIndex(g => g.id === match.groupId);
      if (groupIndex !== undefined && groupIndex !== -1 && tournament.groups) {
        const group = { ...tournament.groups[groupIndex] };
        if (group.standings) {
          const p1Standing = group.standings.find(s => s.participantId === match.participant1Id);
          const p2Standing = group.standings.find(s => s.participantId === match.participant2Id);
          
          if (p1Standing && p2Standing) {
            p1Standing.played++;
            p2Standing.played++;
            p1Standing.pointsFor += input.participant1Score;
            p1Standing.pointsAgainst += input.participant2Score;
            p2Standing.pointsFor += input.participant2Score;
            p2Standing.pointsAgainst += input.participant1Score;
            
            if (input.participant1Score > input.participant2Score) {
              p1Standing.won++;
              p2Standing.lost++;
              p1Standing.points += tournament.config.pointsWin || 3;
              p2Standing.points += tournament.config.pointsLoss || 0;
            } else if (input.participant1Score < input.participant2Score) {
              p2Standing.won++;
              p1Standing.lost++;
              p2Standing.points += tournament.config.pointsWin || 3;
              p1Standing.points += tournament.config.pointsLoss || 0;
            } else {
              p1Standing.drawn++;
              p2Standing.drawn++;
              p1Standing.points += tournament.config.pointsDraw || 1;
              p2Standing.points += tournament.config.pointsDraw || 1;
            }
          }
        }
        
        const updatedGroups = [...tournament.groups];
        updatedGroups[groupIndex] = group;
        tournament.groups = updatedGroups;
      }
    }

    // Vérifier si le tournoi est terminé
    const allCompleted = updatedMatches.every(m => m.status === 'completed');
    
    const updated: Tournament = {
      ...tournament,
      matches: updatedMatches,
      status: allCompleted ? 'completed' : 'in_progress',
      winnerId: allCompleted ? input.winnerId : undefined,
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
    startTournament
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
