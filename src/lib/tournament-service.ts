import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  Tournament, 
  Participant, 
  Match, 
  Group, 
  GroupStanding,
  Penalty,
  ParticipantStatus 
} from '@/types';

// ============================================
// HELPERS - Conversion entre types app et DB
// ============================================

function dbTournamentToApp(dbTournament: any, relations?: {
  participants?: any[];
  matches?: any[];
  groups?: any[];
  penalties?: any[];
  participantStatuses?: any[];
}): Tournament {
  return {
    id: dbTournament.id,
    name: dbTournament.name,
    description: dbTournament.description,
    format: dbTournament.format,
    status: dbTournament.status,
    config: dbTournament.config || {},
    game: dbTournament.game,
    category: dbTournament.category,
    tags: dbTournament.tags,
    winnerId: dbTournament.winner_id,
    createdAt: new Date(dbTournament.created_at),
    updatedAt: new Date(dbTournament.updated_at),
    startedAt: dbTournament.started_at ? new Date(dbTournament.started_at) : undefined,
    completedAt: dbTournament.completed_at ? new Date(dbTournament.completed_at) : undefined,
    participants: relations?.participants?.map(dbParticipantToApp) || [],
    matches: relations?.matches?.map(dbMatchToApp) || [],
    groups: relations?.groups?.map(g => dbGroupToApp(g, relations?.participants || [])) || [],
    penalties: relations?.penalties?.map(dbPenaltyToApp) || [],
    participantStatuses: relations?.participantStatuses?.map(dbStatusToApp) || []
  };
}

function dbParticipantToApp(dbParticipant: any): Participant {
  return {
    id: dbParticipant.id,
    name: dbParticipant.name,
    email: dbParticipant.email,
    seed: dbParticipant.seed,
    team: dbParticipant.team,
    avatarUrl: dbParticipant.avatar_url
  };
}

function dbMatchToApp(dbMatch: any): Match {
  return {
    id: dbMatch.id,
    tournamentId: dbMatch.tournament_id,
    groupId: dbMatch.group_id,
    round: dbMatch.round,
    position: dbMatch.position,
    participant1Id: dbMatch.participant1_id,
    participant2Id: dbMatch.participant2_id,
    winnerId: dbMatch.winner_id,
    score: dbMatch.score_participant1 !== null ? {
      participant1Score: dbMatch.score_participant1,
      participant2Score: dbMatch.score_participant2
    } : undefined,
    status: dbMatch.status,
    scheduledAt: dbMatch.scheduled_at ? new Date(dbMatch.scheduled_at) : undefined
  };
}

function dbGroupToApp(dbGroup: any, participants: any[]): Group {
  const groupParticipantIds = dbGroup.group_participants?.map((gp: any) => gp.participant_id) || [];
  const standings = dbGroup.group_standings?.map((s: any) => dbStandingToApp(s)) || [];
  
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    tournamentId: dbGroup.tournament_id,
    participantIds: groupParticipantIds,
    standings
  };
}

function dbStandingToApp(dbStanding: any): GroupStanding {
  return {
    participantId: dbStanding.participant_id,
    played: dbStanding.played,
    won: dbStanding.won,
    drawn: dbStanding.drawn,
    lost: dbStanding.lost,
    pointsFor: dbStanding.points_for,
    pointsAgainst: dbStanding.points_against,
    points: dbStanding.points
  };
}

function dbPenaltyToApp(dbPenalty: any): Penalty {
  return {
    id: dbPenalty.id,
    participantId: dbPenalty.participant_id,
    points: dbPenalty.points,
    reason: dbPenalty.reason,
    createdAt: new Date(dbPenalty.created_at)
  };
}

function dbStatusToApp(dbStatus: any): ParticipantStatus {
  return {
    participantId: dbStatus.participant_id,
    isEliminated: dbStatus.is_eliminated,
    eliminatedAt: dbStatus.eliminated_at ? new Date(dbStatus.eliminated_at) : undefined,
    eliminationReason: dbStatus.elimination_reason,
    lastOpponentId: dbStatus.last_opponent_id
  };
}

// ============================================
// TOURNAMENT SERVICE
// ============================================

export const tournamentService = {
  // Récupérer tous les tournois
  async getAll(): Promise<Tournament[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured');
      return [];
    }

    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }

    return tournaments.map(t => dbTournamentToApp(t));
  },

  // Récupérer un tournoi avec toutes ses relations
  async getById(id: string): Promise<Tournament | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    // Récupérer le tournoi
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tournamentError || !tournament) {
      console.error('Error fetching tournament:', tournamentError);
      return null;
    }

    // Récupérer les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', id);

    // Récupérer les matchs
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('position', { ascending: true });

    // Récupérer les groupes avec standings
    const { data: groups } = await supabase
      .from('groups')
      .select(`
        *,
        group_participants (participant_id),
        group_standings (*)
      `)
      .eq('tournament_id', id);

    // Récupérer les pénalités
    const { data: penalties } = await supabase
      .from('penalties')
      .select('*')
      .eq('tournament_id', id);

    // Récupérer les statuts
    const { data: participantStatuses } = await supabase
      .from('participant_statuses')
      .select('*')
      .eq('tournament_id', id);

    return dbTournamentToApp(tournament, {
      participants: participants || [],
      matches: matches || [],
      groups: groups || [],
      penalties: penalties || [],
      participantStatuses: participantStatuses || []
    });
  },

  // Créer un tournoi
  async create(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournament.name,
        description: tournament.description,
        format: tournament.format,
        status: tournament.status,
        config: tournament.config,
        game: tournament.game,
        category: tournament.category,
        tags: tournament.tags
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }

    return dbTournamentToApp(data);
  },

  // Mettre à jour un tournoi
  async update(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.config !== undefined) dbUpdates.config = updates.config;
    if (updates.winnerId !== undefined) dbUpdates.winner_id = updates.winnerId;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt?.toISOString();
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt?.toISOString();

    const { data, error } = await supabase
      .from('tournaments')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }

    return dbTournamentToApp(data);
  },

  // Supprimer un tournoi
  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  },

  // Ajouter un participant
  async addParticipant(tournamentId: string, participant: { name: string; email?: string; seed?: number }): Promise<Participant> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        tournament_id: tournamentId,
        name: participant.name,
        email: participant.email,
        seed: participant.seed
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding participant:', error);
      throw error;
    }

    return dbParticipantToApp(data);
  },

  // Supprimer un participant
  async removeParticipant(participantId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Mettre à jour un match
  async updateMatch(matchId: string, updates: {
    participant1Score?: number;
    participant2Score?: number;
    winnerId?: string | null;
    status?: Match['status'];
  }): Promise<Match> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {};
    if (updates.participant1Score !== undefined) dbUpdates.score_participant1 = updates.participant1Score;
    if (updates.participant2Score !== undefined) dbUpdates.score_participant2 = updates.participant2Score;
    if (updates.winnerId !== undefined) dbUpdates.winner_id = updates.winnerId;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('matches')
      .update(dbUpdates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating match:', error);
      throw error;
    }

    return dbMatchToApp(data);
  },

  // Ajouter une pénalité
  async addPenalty(tournamentId: string, participantId: string, points: number, reason: string): Promise<Penalty> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('penalties')
      .insert({
        tournament_id: tournamentId,
        participant_id: participantId,
        points,
        reason
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding penalty:', error);
      throw error;
    }

    return dbPenaltyToApp(data);
  },

  // Supprimer une pénalité
  async removePenalty(penaltyId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('penalties')
      .delete()
      .eq('id', penaltyId);

    if (error) {
      console.error('Error removing penalty:', error);
      throw error;
    }
  },

  // Éliminer un participant
  async eliminateParticipant(tournamentId: string, participantId: string, reason: string, lastOpponentId?: string): Promise<ParticipantStatus> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('participant_statuses')
      .upsert({
        tournament_id: tournamentId,
        participant_id: participantId,
        is_eliminated: true,
        eliminated_at: new Date().toISOString(),
        elimination_reason: reason,
        last_opponent_id: lastOpponentId
      }, {
        onConflict: 'tournament_id,participant_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error eliminating participant:', error);
      throw error;
    }

    return dbStatusToApp(data);
  },

  // Réintégrer un participant
  async reinstateParticipant(tournamentId: string, participantId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('participant_statuses')
      .update({
        is_eliminated: false,
        eliminated_at: null,
        elimination_reason: null
      })
      .eq('tournament_id', tournamentId)
      .eq('participant_id', participantId);

    if (error) {
      console.error('Error reinstating participant:', error);
      throw error;
    }
  },

  // Recalculer les standings d'un groupe
  async recalculateGroupStandings(groupId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.rpc('recalculate_group_standings', {
      p_group_id: groupId
    });

    if (error) {
      console.error('Error recalculating standings:', error);
      throw error;
    }
  }
};
