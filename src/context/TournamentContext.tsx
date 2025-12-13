import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { tournamentService } from '@/lib/tournament-service';
import { supabase } from '@/lib/supabase';
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

// Importer les utils depuis les modules séparés
import { createEvent } from '@/utils/tournament/event-utils';
import { calculateWinner } from '@/utils/tournament/match-utils';
import { 
  determineTournamentWinner,
  calculateSwissStandings
} from '@/utils/tournament/standings-utils';
import {
  generateSingleEliminationMatches,
  generateGroupStageMatches,
  generateChampionshipMatches,
  generateSwissInitialRound,
  generateNextSwissRound
} from '@/utils/tournament/bracket-generators';

// Ré-exporter getTiedParticipants pour les composants qui l'importent d'ici
export { getTiedParticipants } from '@/utils/tournament/standings-utils';

// Clé localStorage pour le fallback
const STORAGE_KEY = 'tournament-manager-data';

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
  createTournament: (input: CreateTournamentInput) => Promise<Tournament>;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (id: string) => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  addParticipant: (tournamentId: string, input: AddParticipantInput) => Promise<void>;
  removeParticipant: (tournamentId: string, participantId: string) => Promise<void>;
  updateParticipantSeed: (tournamentId: string, participantId: string, newSeed: number) => void;
  generateBracket: (tournamentId: string) => Promise<void>;
  generateSwissNextRound: (tournamentId: string) => Promise<void>;
  submitMatchResult: (input: MatchResultInput) => void;
  startTournament: (tournamentId: string) => void;
  setTournamentWinner: (tournamentId: string, winnerId: string) => void;
  // Nouvelles fonctions
  addPenalty: (tournamentId: string, participantId: string, points: number, reason: string) => Promise<void>;
  removePenalty: (tournamentId: string, penaltyId: string) => Promise<void>;
  eliminateParticipant: (tournamentId: string, participantId: string, reason: string, useRepechage?: boolean) => void;
  reinstateParticipant: (tournamentId: string, participantId: string) => void;
  // Sync
  loadTournaments: () => Promise<void>;
  syncEnabled: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Provider
export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);
  const syncEnabled = tournamentService.isConfigured();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // Charger les tournois au démarrage
  const loadTournaments = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (syncEnabled) {
        // Charger depuis Supabase
        const tournaments = await tournamentService.getAll();
        
        // Pour chaque tournoi, charger les détails complets
        const fullTournaments = await Promise.all(
          tournaments.map((t: Tournament) => tournamentService.getById(t.id))
        );
        
        dispatch({ 
          type: 'SET_TOURNAMENTS', 
          payload: fullTournaments.filter((t: Tournament | null): t is Tournament => t !== null) 
        });
        console.log('Tournaments loaded from Supabase');
      } else {
        // Charger depuis localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Reconvertir les dates
          const tournaments = data.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            startedAt: t.startedAt ? new Date(t.startedAt) : undefined,
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            penalties: t.penalties?.map((p: any) => ({
              ...p,
              createdAt: new Date(p.createdAt)
            })) || [],
            participantStatuses: t.participantStatuses?.map((s: any) => ({
              ...s,
              eliminatedAt: s.eliminatedAt ? new Date(s.eliminatedAt) : undefined
            })) || []
          }));
          dispatch({ type: 'SET_TOURNAMENTS', payload: tournaments });
          console.log('Tournaments loaded from localStorage');
        }
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des tournois' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [syncEnabled]);

  // Charger au démarrage
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadTournaments();
    }
  }, [loadTournaments]);

  // Sauvegarder dans localStorage (toujours, comme backup)
  useEffect(() => {
    if (state.tournaments.length > 0 || initialLoadDone.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tournaments));
    }
  }, [state.tournaments]);

  // Fonction helper pour synchroniser avec Supabase (avec debounce)
  const syncToSupabase = useCallback((tournament: Tournament) => {
    if (!syncEnabled) return;

    // Annuler le timeout précédent
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Synchroniser après un délai (debounce)
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await tournamentService.syncTournament(tournament);
        console.log('Tournament synced to Supabase:', tournament.id);
      } catch (error) {
        console.error('Error syncing tournament:', error);
      }
    }, 1000);
  }, [syncEnabled]);

  const createTournament = useCallback(async (input: CreateTournamentInput): Promise<Tournament> => {
    const tournamentId = uuidv4();
    
    // Événement de création
    const creationEvent = createEvent(
      'tournament_created',
      `Tournoi "${input.name}" créé`
    );
    
    const tournament: Tournament = {
      id: tournamentId,
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
      events: [creationEvent],
      createdAt: new Date(),
      updatedAt: new Date(),
      game: input.game,
      category: input.category,
      imageUrl: input.imageUrl,
      // Nouvelles dates
      scheduledStartDate: input.scheduledStartDate,
      registrationEndDate: input.registrationEndDate,
      registrationOpen: input.registrationOpen
    };
    
    // Si Supabase est configuré, créer le tournoi là-bas
    if (syncEnabled) {
      try {
        const created = await tournamentService.createFull(tournament);
        dispatch({ type: 'ADD_TOURNAMENT', payload: created });
        return created;
      } catch (error) {
        console.error('Error creating tournament in Supabase:', error);
        // Fallback: créer localement
        dispatch({ type: 'ADD_TOURNAMENT', payload: tournament });
        return tournament;
      }
    } else {
      dispatch({ type: 'ADD_TOURNAMENT', payload: tournament });
      return tournament;
    }
  }, [syncEnabled]);

  const updateTournament = useCallback((tournament: Tournament) => {
    tournament.updatedAt = new Date();
    dispatch({ type: 'UPDATE_TOURNAMENT', payload: tournament });
    syncToSupabase(tournament);
  }, [syncToSupabase]);

  const deleteTournament = useCallback(async (id: string) => {
    // Récupérer le tournoi avant suppression pour avoir l'URL de l'image
    const tournament = state.tournaments.find(t => t.id === id);
    
    dispatch({ type: 'DELETE_TOURNAMENT', payload: id });
    
    if (syncEnabled) {
      try {
        // Supprimer l'image du storage si elle existe
        if (tournament?.imageUrl && tournament.imageUrl.includes('supabase')) {
          await tournamentService.deleteTournamentImage(tournament.imageUrl);
          console.log('Tournament image deleted from Storage');
        }
        
        await tournamentService.delete(id);
        console.log('Tournament deleted from Supabase:', id);
      } catch (error) {
        console.error('Error deleting tournament from Supabase:', error);
      }
    }
  }, [syncEnabled, state.tournaments]);

  const setCurrentTournament = useCallback((tournament: Tournament | null) => {
    dispatch({ type: 'SET_CURRENT_TOURNAMENT', payload: tournament });
  }, []);

  const addParticipant = useCallback(async (tournamentId: string, input: AddParticipantInput) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    let participantId = uuidv4();
    
    // Si Supabase est activé, créer le participant là-bas
    if (syncEnabled) {
      try {
        const created = await tournamentService.addParticipant(tournamentId, {
          name: input.name,
          seed: input.seed || tournament.participants.length + 1
        });
        participantId = created.id;
        console.log('Participant added to Supabase:', created);
      } catch (err) {
        console.error('Error adding participant to Supabase:', err);
        // Continue avec l'ID local en cas d'erreur
      }
    }

    // Assigner automatiquement le seed si non fourni
    const autoSeed = input.seed || tournament.participants.length + 1;

    const participant: Participant = {
      id: participantId,
      name: input.name,
      seed: autoSeed,
      metadata: input.metadata
    };

    // Créer l'événement
    const event = createEvent(
      'participant_added',
      `${input.name} a rejoint le tournoi`,
      { participantId, participantName: input.name }
    );

    const updated = {
      ...tournament,
      participants: [...tournament.participants, participant],
      events: [...(tournament.events || []), event],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments, syncEnabled]);

  const removeParticipant = useCallback(async (tournamentId: string, participantId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    // Trouver le participant pour l'événement
    const participant = tournament.participants.find(p => p.id === participantId);

    // Supprimer de Supabase si activé
    if (syncEnabled) {
      try {
        await tournamentService.removeParticipant(participantId);
        console.log('Participant removed from Supabase:', participantId);
      } catch (err) {
        console.error('Error removing participant from Supabase:', err);
      }
    }

    // Créer l'événement
    const event = createEvent(
      'participant_removed',
      `${participant?.name || 'Un participant'} a quitté le tournoi`,
      { participantId, participantName: participant?.name }
    );

    const updated = {
      ...tournament,
      participants: tournament.participants.filter(p => p.id !== participantId),
      events: [...(tournament.events || []), event],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments, syncEnabled]);

  const updateParticipantSeed = useCallback((tournamentId: string, participantId: string, newSeed: number) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    // Trouver le participant actuel et celui qui a le seed cible
    const currentParticipant = tournament.participants.find(p => p.id === participantId);
    if (!currentParticipant) return;
    
    const oldSeed = currentParticipant.seed;
    
    // Si le seed ne change pas, ne rien faire
    if (oldSeed === newSeed) return;

    // Mettre à jour les seeds de manière atomique (swap)
    const updatedParticipants = tournament.participants.map(p => {
      if (p.id === participantId) {
        return { ...p, seed: newSeed };
      }
      // Si un autre participant a le nouveau seed, lui donner l'ancien
      if (p.seed === newSeed && oldSeed !== undefined) {
        return { ...p, seed: oldSeed };
      }
      return p;
    });

    const updated = {
      ...tournament,
      participants: updatedParticipants,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

  const generateBracket = useCallback(async (tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.participants.length < 2) return;

    let matches: Match[] = [];
    let groups: Group[] = [];
    let championshipStandings: GroupStanding[] | undefined;
    const seedingType = tournament.config.seeding || 'random';

    switch (tournament.format) {
      case 'single_elimination':
        matches = generateSingleEliminationMatches(tournament.participants, seedingType);
        break;
      case 'double_elimination':
        // Pour le moment, on génère comme une élimination simple
        // Une implémentation complète ajouterait le bracket des perdants
        matches = generateSingleEliminationMatches(tournament.participants, seedingType);
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
      case 'swiss': {
        const result = generateSwissInitialRound(
          tournament.participants,
          tournament.config
        );
        matches = result.matches;
        // Pour le suisse, on crée un groupe virtuel pour stocker les standings
        groups = [{
          id: uuidv4(),
          name: 'Classement Suisse',
          tournamentId,
          participantIds: tournament.participants.map(p => p.id),
          standings: result.standings
        }];
        break;
      }
    }

    // Assigner l'ID du tournoi à tous les matchs et groupes
    matches = matches.map(m => ({ ...m, tournamentId }));
    groups = groups.map(g => ({ ...g, tournamentId }));

    // Si Supabase est activé, créer les groupes et matchs
    if (syncEnabled && supabase) {
      try {
        // Créer les groupes si nécessaire
        if (groups.length > 0) {
          for (const group of groups) {
            // Créer le groupe
            const { error: groupError } = await supabase
              .from('groups')
              .insert({
                id: group.id,
                tournament_id: tournamentId,
                name: group.name
              } as any);
            
            if (groupError) {
              console.error('Error creating group:', groupError);
              continue;
            }
            
            // Créer les associations groupe-participant
            if (group.participantIds.length > 0) {
              const { error: gpError } = await supabase
                .from('group_participants')
                .insert(
                  group.participantIds.map(pId => ({
                    group_id: group.id,
                    participant_id: pId
                  })) as any
                );
              
              if (gpError) console.error('Error creating group_participants:', gpError);
            }
            
            // Créer les standings
            if (group.standings && group.standings.length > 0) {
              const { error: standingsError } = await supabase
                .from('group_standings')
                .insert(
                  group.standings.map(s => ({
                    group_id: group.id,
                    participant_id: s.participantId,
                    played: s.played,
                    won: s.won,
                    drawn: s.drawn,
                    lost: s.lost,
                    points_for: s.pointsFor,
                    points_against: s.pointsAgainst,
                    points: s.points
                  })) as any
                );
              
              if (standingsError) console.error('Error creating standings:', standingsError);
            }
          }
          console.log('Groups created in Supabase');
        }
        
        // Créer les matchs
        if (matches.length > 0) {
          const { error: matchesError } = await supabase
            .from('matches')
            .insert(
              matches.map(m => ({
                id: m.id,
                tournament_id: tournamentId,
                group_id: m.groupId || null,
                round: m.round,
                position: m.position,
                participant1_id: m.participant1Id || null,
                participant2_id: m.participant2Id || null,
                winner_id: m.winnerId || null,
                loser_id: m.loserId || null,
                score_participant1: m.score?.participant1Score ?? null,
                score_participant2: m.score?.participant2Score ?? null,
                status: m.status,
                bracket: m.bracket || null
              })) as any
            );
          
          if (matchesError) {
            console.error('Error creating matches:', matchesError);
          } else {
            console.log('Matches created in Supabase:', matches.length);
          }
        }
      } catch (err) {
        console.error('Error syncing bracket to Supabase:', err);
      }
    }

    const updated = {
      ...tournament,
      matches,
      groups,
      events: [...(tournament.events || []), createEvent(
        'bracket_generated',
        `Bracket généré avec ${matches.length} matchs`,
        { }
      )],
      // Pour Swiss, démarrer directement car pas de phase d'inscription distincte
      status: tournament.format === 'swiss' ? 'in_progress' as const : 'registration' as const,
      startedAt: tournament.format === 'swiss' ? new Date() : undefined,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
  }, [state.tournaments, syncEnabled]);

  // Générer la ronde suivante pour un tournoi suisse
  const generateSwissNextRound = useCallback(async (tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || tournament.format !== 'swiss') return;

    // Vérifier que tous les matchs de la ronde actuelle sont terminés
    const currentRound = Math.max(...tournament.matches.map(m => m.round), 0);
    const currentRoundMatches = tournament.matches.filter(m => m.round === currentRound);
    const allCompleted = currentRoundMatches.every(m => m.status === 'completed');
    
    if (!allCompleted && currentRound > 0) {
      console.warn('Cannot generate next round: current round not completed');
      return;
    }

    // Calculer le nombre de rondes prévu
    const totalRounds = tournament.config.swissRounds || 
      Math.ceil(Math.log2(tournament.participants.length));
    
    const nextRound = currentRound + 1;
    
    // Vérifier si le tournoi est terminé
    if (nextRound > totalRounds) {
      console.log('Swiss tournament completed');
      return;
    }

    // Générer les matchs de la prochaine ronde
    const avoidRematches = tournament.config.swissAvoidRematches !== false;
    const newMatches = generateNextSwissRound(
      tournament.participants,
      tournament.matches,
      nextRound,
      avoidRematches
    );

    // Assigner l'ID du tournoi
    const matchesWithTournament = newMatches.map(m => ({ ...m, tournamentId }));

    // Mettre à jour les standings avec les points configurés
    const pointsConfig = {
      pointsWin: tournament.config.pointsWin,
      pointsDraw: tournament.config.pointsDraw,
      pointsLoss: tournament.config.pointsLoss
    };
    const standings = calculateSwissStandings(
      tournament.participants, 
      tournament.matches, 
      pointsConfig,
      tournament.penalties
    );
    const groupStandings: GroupStanding[] = standings.map(s => ({
      participantId: s.participantId,
      played: s.wins + s.draws + s.losses,
      won: s.wins,
      drawn: s.draws,
      lost: s.losses,
      pointsFor: s.points,
      pointsAgainst: 0,
      points: s.points
    }));

    // Mettre à jour le groupe avec les standings
    const updatedGroups = tournament.groups?.map(g => ({
      ...g,
      standings: groupStandings
    })) || [];

    // Sync avec Supabase si activé
    if (syncEnabled && supabase) {
      try {
        const { error } = await supabase
          .from('matches')
          .insert(
            matchesWithTournament.map(m => ({
              id: m.id,
              tournament_id: tournamentId,
              round: m.round,
              position: m.position,
              participant1_id: m.participant1Id || null,
              participant2_id: m.participant2Id || null,
              winner_id: m.winnerId || null,
              status: m.status
            })) as any
          );
        
        if (error) console.error('Error creating swiss matches:', error);
      } catch (err) {
        console.error('Error syncing swiss round:', err);
      }
    }

    const updated = {
      ...tournament,
      matches: [...tournament.matches, ...matchesWithTournament],
      groups: updatedGroups,
      events: [...(tournament.events || []), createEvent(
        'bracket_generated',
        `Ronde ${nextRound} générée avec ${newMatches.length} matchs`,
        { round: nextRound }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncEnabled, syncToSupabase]);

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

    // Déterminer le status du match
    const isPartial = input.isPartial === true;
    const matchStatus = isPartial ? 'in_progress' : 'completed';

    const updatedMatch: Match = {
      ...match,
      score: {
        participant1Score: input.participant1Score,
        participant2Score: input.participant2Score
      },
      scoreHistory: scoreHistory.length > 0 ? scoreHistory : undefined,
      games: input.games || match.games, // Stocker les manches du Best-of
      winnerId: isPartial ? undefined : winnerId, // Pas de vainqueur si partiel
      loserId: !isPartial && winnerId ? (match.participant1Id === winnerId ? match.participant2Id : match.participant1Id) : undefined,
      status: matchStatus as 'in_progress' | 'completed',
      startedAt: match.startedAt || new Date(),
      completedAt: isPartial ? undefined : new Date()
    };

    const updatedMatches = [...tournament.matches];
    updatedMatches[matchIndex] = updatedMatch;

    // Si élimination simple, faire avancer le gagnant (seulement si match terminé)
    if (!isPartial && (tournament.format === 'single_elimination' || tournament.format === 'double_elimination')) {
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

    // Mettre à jour les standings pour groupes et championnat (seulement si match terminé)
    let updatedGroups = tournament.groups ? [...tournament.groups] : [];
    
    if (!isPartial && ((tournament.format === 'groups' && match.groupId) || tournament.format === 'championship')) {
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

    // Mettre à jour les standings pour le système suisse (seulement si match terminé)
    if (!isPartial && tournament.format === 'swiss' && updatedGroups.length > 0) {
      // Recalculer les standings Swiss à partir de tous les matchs
      const pointsConfig = {
        pointsWin: tournament.config.pointsWin,
        pointsDraw: tournament.config.pointsDraw,
        pointsLoss: tournament.config.pointsLoss
      };
      const swissStandings = calculateSwissStandings(
        tournament.participants, 
        updatedMatches, 
        pointsConfig,
        tournament.penalties
      );
      
      // Convertir en GroupStanding
      const groupStandings: GroupStanding[] = swissStandings.map(s => ({
        participantId: s.participantId,
        played: s.wins + s.draws + s.losses,
        won: s.wins,
        drawn: s.draws,
        lost: s.losses,
        pointsFor: s.points,
        pointsAgainst: 0, // Pas utilisé en Swiss
        points: s.points
      }));
      
      // Mettre à jour le groupe
      updatedGroups = updatedGroups.map(g => ({
        ...g,
        standings: groupStandings
      }));
    }

    // Vérifier si le tournoi est terminé
    const allMatchesCompleted = updatedMatches.every(m => m.status === 'completed');
    
    // Pour Swiss, vérifier si toutes les rondes sont jouées
    let isTournamentCompleted = allMatchesCompleted;
    if (tournament.format === 'swiss') {
      const currentRound = Math.max(...updatedMatches.map(m => m.round), 0);
      const totalRounds = tournament.config.swissRounds || Math.ceil(Math.log2(tournament.participants.length));
      // Swiss n'est terminé que si on a joué toutes les rondes ET que la dernière ronde est complète
      isTournamentCompleted = allMatchesCompleted && currentRound >= totalRounds;
    }
    
    // Déterminer le vainqueur du tournoi si terminé
    let tournamentWinnerId: string | undefined;
    if (isTournamentCompleted) {
      tournamentWinnerId = determineTournamentWinner(
        tournament.format,
        updatedMatches,
        updatedGroups,
        updatedGroups[0]?.standings,
        tournament.config.useHeadToHead
      );
    }

    // Créer l'événement
    const participant1 = tournament.participants.find(p => p.id === match.participant1Id);
    const participant2 = tournament.participants.find(p => p.id === match.participant2Id);
    const winner = tournament.participants.find(p => p.id === winnerId);
    
    const events = [...(tournament.events || [])];
    
    if (isPartial) {
      // Sauvegarde partielle - match en cours
      events.push(createEvent(
        'match_score_updated',
        `Match en cours : ${participant1?.name || '?'} ${input.participant1Score} - ${input.participant2Score} ${participant2?.name || '?'}`,
        { 
          matchId: input.matchId,
          round: match.round,
          score: { participant1Score: input.participant1Score, participant2Score: input.participant2Score },
          games: input.games,
          isPartial: true
        }
      ));
    } else if (isModification) {
      events.push(createEvent(
        'match_score_updated',
        `Score modifié : ${participant1?.name || '?'} ${input.participant1Score} - ${input.participant2Score} ${participant2?.name || '?'}`,
        { 
          matchId: input.matchId,
          round: match.round,
          score: { participant1Score: input.participant1Score, participant2Score: input.participant2Score },
          previousScore: match.score,
          winnerId,
          winnerName: winner?.name
        }
      ));
    } else {
      events.push(createEvent(
        'match_completed',
        `Match terminé : ${participant1?.name || '?'} ${input.participant1Score} - ${input.participant2Score} ${participant2?.name || '?'}${winner ? ` • Vainqueur : ${winner.name}` : ''}`,
        { 
          matchId: input.matchId,
          round: match.round,
          score: { participant1Score: input.participant1Score, participant2Score: input.participant2Score },
          winnerId,
          winnerName: winner?.name
        }
      ));
    }

    // Événement de fin de tournoi si terminé
    if (isTournamentCompleted && tournamentWinnerId) {
      const tournamentWinner = tournament.participants.find(p => p.id === tournamentWinnerId);
      events.push(createEvent(
        'tournament_completed',
        `Tournoi terminé ! Vainqueur : ${tournamentWinner?.name || '?'}`,
        { winnerId: tournamentWinnerId, winnerName: tournamentWinner?.name }
      ));
    }
    
    const updated: Tournament = {
      ...tournament,
      matches: updatedMatches,
      groups: updatedGroups,
      events,
      status: isTournamentCompleted ? 'completed' : 'in_progress',
      winnerId: tournamentWinnerId,
      completedAt: isTournamentCompleted ? new Date() : undefined,
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

  const startTournament = useCallback((tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const updated = {
      ...tournament,
      events: [...(tournament.events || []), createEvent(
        'tournament_started',
        'Le tournoi a démarré'
      )],
      status: 'in_progress' as const,
      startedAt: new Date(),
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

  const setTournamentWinner = useCallback((tournamentId: string, winnerId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const winner = tournament.participants.find(p => p.id === winnerId);

    const updated = {
      ...tournament,
      winnerId,
      status: 'completed' as const,
      completedAt: new Date(),
      events: [...(tournament.events || []), createEvent(
        'tournament_completed',
        `Tournoi terminé ! Vainqueur : ${winner?.name || '?'}`,
        { winnerId, winnerName: winner?.name }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

  // Ajouter une pénalité à un participant
  const addPenalty = useCallback(async (tournamentId: string, participantId: string, points: number, reason: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    let penaltyId = uuidv4();

    // Créer dans Supabase si activé
    if (syncEnabled) {
      try {
        const created = await tournamentService.addPenalty(tournamentId, participantId, points, reason);
        penaltyId = created.id;
        console.log('Penalty added to Supabase:', created);
      } catch (err) {
        console.error('Error adding penalty to Supabase:', err);
      }
    }

    const newPenalty: Penalty = {
      id: penaltyId,
      participantId,
      points,
      reason,
      createdAt: new Date()
    };

    // Trouver le participant pour l'événement
    const participant = tournament.participants.find(p => p.id === participantId);

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
      events: [...(tournament.events || []), createEvent(
        'penalty_added',
        `Pénalité de ${points} point(s) pour ${participant?.name || '?'} : ${reason}`,
        { participantId, participantName: participant?.name, penaltyId, penaltyPoints: points, reason }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncEnabled, syncToSupabase]);

  // Supprimer une pénalité
  const removePenalty = useCallback(async (tournamentId: string, penaltyId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament || !tournament.penalties) return;

    const penalty = tournament.penalties.find(p => p.id === penaltyId);
    if (!penalty) return;

    // Supprimer de Supabase si activé
    if (syncEnabled) {
      try {
        await tournamentService.removePenalty(penaltyId);
        console.log('Penalty removed from Supabase:', penaltyId);
      } catch (err) {
        console.error('Error removing penalty from Supabase:', err);
      }
    }

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

    // Trouver le participant pour l'événement
    const participant = tournament.participants.find(p => p.id === penalty.participantId);

    const updated = {
      ...tournament,
      penalties: tournament.penalties.filter(p => p.id !== penaltyId),
      groups: updatedGroups,
      events: [...(tournament.events || []), createEvent(
        'penalty_removed',
        `Pénalité de ${penalty.points} point(s) retirée pour ${participant?.name || '?'}`,
        { participantId: penalty.participantId, participantName: participant?.name, penaltyId, penaltyPoints: penalty.points }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncEnabled, syncToSupabase]);

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

    // Trouver le participant pour l'événement
    const participant = tournament.participants.find(p => p.id === participantId);
    const repechedParticipant = repechedParticipantId 
      ? tournament.participants.find(p => p.id === repechedParticipantId)
      : undefined;

    let eventDescription = `${participant?.name || '?'} éliminé : ${reason}`;
    if (repechedParticipant) {
      eventDescription += ` (${repechedParticipant.name} repêché)`;
    }

    const updated = {
      ...tournament,
      participantStatuses: updatedStatuses,
      matches: updatedMatches,
      events: [...(tournament.events || []), createEvent(
        'participant_eliminated',
        eventDescription,
        { participantId, participantName: participant?.name, reason }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

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

    // Trouver le participant pour l'événement
    const participant = tournament.participants.find(p => p.id === participantId);

    const updated = {
      ...tournament,
      participantStatuses: updatedStatuses,
      matches: updatedMatches,
      events: [...(tournament.events || []), createEvent(
        'participant_reinstated',
        `${participant?.name || '?'} réintégré dans le tournoi`,
        { participantId, participantName: participant?.name }
      )],
      updatedAt: new Date()
    };

    dispatch({ type: 'UPDATE_TOURNAMENT', payload: updated });
    syncToSupabase(updated);
  }, [state.tournaments, syncToSupabase]);

  const value: TournamentContextType = {
    ...state,
    createTournament,
    updateTournament,
    deleteTournament,
    setCurrentTournament,
    addParticipant,
    removeParticipant,
    updateParticipantSeed,
    generateBracket,
    generateSwissNextRound,
    submitMatchResult,
    startTournament,
    setTournamentWinner,
    addPenalty,
    removePenalty,
    eliminateParticipant,
    reinstateParticipant,
    loadTournaments,
    syncEnabled
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
