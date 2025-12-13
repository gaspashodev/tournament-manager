// Service de synchronisation avec Supabase
import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  Tournament, 
  Participant, 
  Match, 
  Group, 
  GroupStanding,
  Penalty,
  ParticipantStatus,
  TournamentEvent,
  TournamentEventType
} from '@/types/tournament';

// ==========================================
// HELPER FUNCTIONS - DB to App conversions
// ==========================================

function dbTournamentToApp(dbTournament: any, relations?: {
  participants?: any[];
  matches?: any[];
  groups?: any[];
  penalties?: any[];
  statuses?: any[];
  events?: any[];
}): Tournament {
  return {
    id: dbTournament.id,
    name: dbTournament.name,
    description: dbTournament.description || undefined,
    format: dbTournament.format,
    status: dbTournament.status,
    config: dbTournament.config || {},
    game: dbTournament.game || undefined,
    category: dbTournament.category || undefined,
    tags: dbTournament.tags || undefined,
    imageUrl: dbTournament.image_url || undefined,
    participants: relations?.participants?.map(dbParticipantToApp) || [],
    matches: relations?.matches?.map(dbMatchToApp) || [],
    groups: relations?.groups?.map(dbGroupToApp) || [],
    penalties: relations?.penalties?.map(dbPenaltyToApp) || [],
    participantStatuses: relations?.statuses?.map(dbStatusToApp) || [],
    events: relations?.events?.map(dbEventToApp) || [],
    winnerId: dbTournament.winner_id || undefined,
    createdAt: new Date(dbTournament.created_at),
    updatedAt: new Date(dbTournament.updated_at),
    startedAt: dbTournament.started_at ? new Date(dbTournament.started_at) : undefined,
    completedAt: dbTournament.completed_at ? new Date(dbTournament.completed_at) : undefined,
    scheduledStartDate: dbTournament.scheduled_start_date ? new Date(dbTournament.scheduled_start_date) : undefined,
    registrationEndDate: dbTournament.registration_end_date ? new Date(dbTournament.registration_end_date) : undefined,
    registrationOpen: dbTournament.registration_open || false
  };
}

function dbParticipantToApp(dbParticipant: any): Participant {
  return {
    id: dbParticipant.id,
    name: dbParticipant.name,
    avatar: dbParticipant.avatar_url || undefined,
    seed: dbParticipant.seed || undefined,
    metadata: dbParticipant.metadata || undefined
  };
}

function dbMatchToApp(dbMatch: any): Match {
  return {
    id: dbMatch.id,
    tournamentId: dbMatch.tournament_id,
    round: dbMatch.round,
    position: dbMatch.position,
    participant1Id: dbMatch.participant1_id || undefined,
    participant2Id: dbMatch.participant2_id || undefined,
    winnerId: dbMatch.winner_id || undefined,
    loserId: dbMatch.loser_id || undefined,
    score: (dbMatch.score_participant1 !== null && dbMatch.score_participant2 !== null) ? {
      participant1Score: dbMatch.score_participant1,
      participant2Score: dbMatch.score_participant2
    } : undefined,
    games: dbMatch.games || undefined,
    bestOf: dbMatch.best_of || undefined,
    phase: dbMatch.phase || undefined,
    status: dbMatch.status,
    bracket: dbMatch.bracket || undefined,
    groupId: dbMatch.group_id || undefined,
    timerRoomCode: dbMatch.timer_room_code || undefined,
    scheduledAt: dbMatch.scheduled_at ? new Date(dbMatch.scheduled_at) : undefined,
    startedAt: dbMatch.started_at ? new Date(dbMatch.started_at) : undefined,
    completedAt: dbMatch.completed_at ? new Date(dbMatch.completed_at) : undefined
  };
}

function dbGroupToApp(dbGroup: any): Group {
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
    eliminationReason: dbStatus.elimination_reason || undefined,
    forfeitMatchId: dbStatus.forfeit_match_id || undefined,
    originalMatchState: dbStatus.original_match_state || undefined,
    promotedOpponentId: dbStatus.promoted_opponent_id || undefined
  };
}

function dbEventToApp(dbEvent: any): TournamentEvent {
  return {
    id: dbEvent.id,
    type: dbEvent.type as TournamentEventType,
    timestamp: new Date(dbEvent.created_at),
    description: dbEvent.description,
    data: dbEvent.data || undefined
  };
}

// ==========================================
// TOURNAMENT SERVICE
// ==========================================

export const tournamentService = {
  // ==========================================
  // TOURNAMENTS
  // ==========================================

  // Récupérer tous les tournois (liste simple)
  async getAll(): Promise<Tournament[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }

    return (data || []).map((t: any) => dbTournamentToApp(t));
  },

  // Récupérer un tournoi complet avec toutes ses relations
  async getById(id: string): Promise<Tournament | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Récupérer le tournoi
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tournamentError) {
      if (tournamentError.code === 'PGRST116') return null; // Not found
      throw tournamentError;
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

    // Récupérer les groupes avec leurs participants et standings
    const { data: groups } = await supabase
      .from('groups')
      .select(`
        *,
        group_participants(participant_id),
        group_standings(*)
      `)
      .eq('tournament_id', id);

    // Récupérer les pénalités
    const { data: penalties } = await supabase
      .from('penalties')
      .select('*')
      .eq('tournament_id', id);

    // Récupérer les statuts des participants
    const { data: statuses } = await supabase
      .from('participant_statuses')
      .select('*')
      .eq('tournament_id', id);

    // Récupérer les événements (historique)
    const { data: events } = await (supabase as any)
      .from('tournament_events')
      .select('*')
      .eq('tournament_id', id)
      .order('created_at', { ascending: false });

    return dbTournamentToApp(tournament, {
      participants: participants || [],
      matches: matches || [],
      groups: groups || [],
      penalties: penalties || [],
      statuses: statuses || [],
      events: events || []
    });
  },

  // Créer un tournoi complet avec participants et matchs
  async createFull(tournament: Tournament): Promise<Tournament> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // 1. Créer le tournoi
    const { data: dbTournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: tournament.name,
        description: tournament.description || null,
        format: tournament.format,
        status: tournament.status,
        config: tournament.config as any,
        game: tournament.game || null,
        category: tournament.category || null,
        tags: tournament.tags || null,
        image_url: tournament.imageUrl || null,
        scheduled_start_date: tournament.scheduledStartDate || null,
        registration_end_date: tournament.registrationEndDate || null,
        registration_open: tournament.registrationOpen || false
      } as any)
      .select()
      .single();

    if (tournamentError) throw tournamentError;
    const tournamentId = (dbTournament as any).id;

    // 2. Créer les participants et mapper les anciens IDs aux nouveaux
    const participantIdMap = new Map<string, string>();
    
    if (tournament.participants.length > 0) {
      const { data: dbParticipants, error: participantsError } = await supabase
        .from('participants')
        .insert(
          tournament.participants.map(p => ({
            tournament_id: tournamentId,
            name: p.name,
            seed: p.seed || null,
            avatar_url: p.avatar || null,
            metadata: p.metadata || null
          })) as any
        )
        .select();

      if (participantsError) throw participantsError;

      // Mapper les anciens IDs aux nouveaux
      (dbParticipants as any[])?.forEach((dbP: any, index: number) => {
        participantIdMap.set(tournament.participants[index].id, dbP.id);
      });
    }

    // Fonction helper pour remapper un ID
    const remapId = (oldId: string | undefined): string | null => {
      if (!oldId) return null;
      return participantIdMap.get(oldId) || null;
    };

    // 3. Créer les groupes si nécessaire
    const groupIdMap = new Map<string, string>();
    
    if (tournament.groups && tournament.groups.length > 0) {
      for (const group of tournament.groups) {
        const { data: dbGroup, error: groupError } = await supabase
          .from('groups')
          .insert({
            tournament_id: tournamentId,
            name: group.name
          })
          .select()
          .single();

        if (groupError) throw groupError;
        groupIdMap.set(group.id, (dbGroup as any).id);

        // Créer les associations groupe-participant
        if (group.participantIds.length > 0) {
          const { error: gpError } = await supabase
            .from('group_participants')
            .insert(
              group.participantIds
                .map(pId => ({
                  group_id: (dbGroup as any).id,
                  participant_id: remapId(pId)
                }))
                .filter(gp => gp.participant_id) as any
            );

          if (gpError) throw gpError;
        }

        // Créer les standings
        if (group.standings && group.standings.length > 0) {
          const { error: standingsError } = await supabase
            .from('group_standings')
            .insert(
              group.standings.map(s => ({
                group_id: (dbGroup as any).id,
                participant_id: remapId(s.participantId),
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                points_for: s.pointsFor,
                points_against: s.pointsAgainst,
                points: s.points
              })).filter((s: any) => s.participant_id) as any
            );

          if (standingsError) throw standingsError;
        }
      }
    }

    // 4. Créer les matchs
    if (tournament.matches.length > 0) {
      const { error: matchesError } = await supabase
        .from('matches')
        .insert(
          tournament.matches.map(m => ({
            tournament_id: tournamentId,
            group_id: m.groupId ? groupIdMap.get(m.groupId) || null : null,
            round: m.round,
            position: m.position,
            participant1_id: remapId(m.participant1Id),
            participant2_id: remapId(m.participant2Id),
            winner_id: remapId(m.winnerId),
            score_participant1: m.score?.participant1Score ?? null,
            score_participant2: m.score?.participant2Score ?? null,
            status: m.status,
            bracket: m.bracket || null,
            scheduled_at: m.scheduledAt?.toISOString() || null
          }))
        );

      if (matchesError) throw matchesError;
    }

    // 5. Récupérer le tournoi complet créé
    const created = await this.getById(tournamentId);
    if (!created) throw new Error('Failed to fetch created tournament');
    
    return created;
  },

  // Créer un tournoi simple
  async create(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournament.name,
        description: tournament.description || null,
        format: tournament.format,
        status: tournament.status,
        config: tournament.config as any,
        game: tournament.game || null,
        category: tournament.category || null,
        tags: tournament.tags || null
      } as any)
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
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

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

  // ==========================================
  // PARTICIPANTS
  // ==========================================

  async addParticipant(tournamentId: string, participant: { name: string; seed?: number; avatar?: string }): Promise<Participant> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        tournament_id: tournamentId,
        name: participant.name,
        seed: participant.seed || null,
        avatar_url: participant.avatar || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding participant:', error);
      throw error;
    }

    return dbParticipantToApp(data);
  },

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

  async updateParticipant(participantId: string, updates: Partial<Participant>): Promise<Participant> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.seed !== undefined) dbUpdates.seed = updates.seed;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;

    const { data, error } = await supabase
      .from('participants')
      .update(dbUpdates)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating participant:', error);
      throw error;
    }

    return dbParticipantToApp(data);
  },

  // ==========================================
  // MATCHES
  // ==========================================

  async updateMatch(match: Match): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('matches')
      .update({
        participant1_id: match.participant1Id || null,
        participant2_id: match.participant2Id || null,
        winner_id: match.winnerId || null,
        loser_id: match.loserId || null,
        score_participant1: match.score?.participant1Score ?? null,
        score_participant2: match.score?.participant2Score ?? null,
        games: match.games || [],
        best_of: match.bestOf || null,
        phase: match.phase || null,
        status: match.status,
        started_at: match.startedAt?.toISOString() || null,
        completed_at: match.completedAt?.toISOString() || null
      } as any)
      .eq('id', match.id);

    if (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  },

  async updateMatches(matches: Match[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Upsert en batch
    const { error } = await supabase
      .from('matches')
      .upsert(
        matches.map(m => ({
          id: m.id,
          tournament_id: m.tournamentId,
          round: m.round,
          position: m.position,
          participant1_id: m.participant1Id || null,
          participant2_id: m.participant2Id || null,
          winner_id: m.winnerId || null,
          loser_id: m.loserId || null,
          score_participant1: m.score?.participant1Score ?? null,
          score_participant2: m.score?.participant2Score ?? null,
          games: m.games || [],
          best_of: m.bestOf || null,
          phase: m.phase || null,
          status: m.status,
          bracket: m.bracket || null,
          group_id: m.groupId || null,
          started_at: m.startedAt?.toISOString() || null,
          completed_at: m.completedAt?.toISOString() || null
        })) as any,
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating matches:', error);
      throw error;
    }
  },

  // ==========================================
  // GROUPS & STANDINGS
  // ==========================================

  async updateGroupStandings(groupId: string, standings: GroupStanding[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('group_standings')
      .upsert(
        standings.map(s => ({
          group_id: groupId,
          participant_id: s.participantId,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          points_for: s.pointsFor,
          points_against: s.pointsAgainst,
          points: s.points
        })),
        { onConflict: 'group_id,participant_id' }
      );

    if (error) {
      console.error('Error updating standings:', error);
      throw error;
    }
  },

  // ==========================================
  // PENALTIES
  // ==========================================

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

  // ==========================================
  // PARTICIPANT STATUSES
  // ==========================================

  async upsertParticipantStatus(tournamentId: string, status: ParticipantStatus): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('participant_statuses')
      .upsert({
        tournament_id: tournamentId,
        participant_id: status.participantId,
        is_eliminated: status.isEliminated,
        eliminated_at: status.eliminatedAt?.toISOString() || null,
        elimination_reason: status.eliminationReason || null,
        forfeit_match_id: status.forfeitMatchId || null,
        original_match_state: status.originalMatchState || null,
        promoted_opponent_id: status.promotedOpponentId || null
      },
      { onConflict: 'tournament_id,participant_id' });

    if (error) {
      console.error('Error upserting participant status:', error);
      throw error;
    }
  },

  // ==========================================
  // SYNC - Sauvegarder un tournoi complet
  // ==========================================

  async syncTournament(tournament: Tournament): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Vérifier d'abord si le tournoi existe dans Supabase
      const { data: existingTournament, error: checkError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', tournament.id)
        .single();
      
      if (checkError || !existingTournament) {
        console.warn('Tournament not found in Supabase, skipping sync:', tournament.id);
        console.warn('This tournament was likely created before Supabase was configured.');
        return;
      }

      // 1. Mettre à jour le tournoi
      await this.update(tournament.id, {
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        config: tournament.config,
        winnerId: tournament.winnerId,
        startedAt: tournament.startedAt,
        completedAt: tournament.completedAt
      });

      // 2. Mettre à jour les matchs
      if (tournament.matches.length > 0) {
        await this.updateMatches(tournament.matches);
      }

      // 3. Mettre à jour les standings des groupes
      if (tournament.groups && tournament.groups.length > 0) {
        await Promise.all(
          tournament.groups
            .filter(g => g.standings && g.standings.length > 0)
            .map(g => this.updateGroupStandings(g.id, g.standings!))
        );
      }

      // 4. Mettre à jour les statuts des participants
      if (tournament.participantStatuses && tournament.participantStatuses.length > 0) {
        await Promise.all(
          tournament.participantStatuses.map(s => this.upsertParticipantStatus(tournament.id, s))
        );
      }

      // 5. Sauvegarder les nouveaux événements
      if (tournament.events && tournament.events.length > 0) {
        await this.syncEvents(tournament.id, tournament.events);
      }

      console.log('Tournament synced successfully:', tournament.id);
    } catch (error) {
      console.error('Error syncing tournament:', error);
      throw error;
    }
  },

  // Synchroniser les événements (seulement les nouveaux)
  async syncEvents(tournamentId: string, events: TournamentEvent[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Récupérer les IDs existants
    const { data: existingEvents } = await (supabase as any)
      .from('tournament_events')
      .select('id')
      .eq('tournament_id', tournamentId);

    const existingIds = new Set((existingEvents || []).map((e: any) => e.id));

    // Filtrer les nouveaux événements
    const newEvents = events.filter(e => !existingIds.has(e.id));

    if (newEvents.length > 0) {
      const { error } = await (supabase as any)
        .from('tournament_events')
        .insert(
          newEvents.map(e => ({
            id: e.id,
            tournament_id: tournamentId,
            type: e.type,
            description: e.description,
            data: e.data || {},
            created_at: e.timestamp
          }))
        );

      if (error) {
        console.error('Error syncing events:', error);
      } else {
        console.log('Events synced:', newEvents.length);
      }
    }
  },

  // ==========================================
  // STORAGE - Images
  // ==========================================

  async uploadTournamentImage(file: File, tournamentId: string): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, cannot upload image');
      return null;
    }

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${tournamentId}-${Date.now()}.${fileExt}`;
      const filePath = `tournaments/${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('tournament-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from('tournament-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading tournament image:', err);
      return null;
    }
  },

  async deleteTournamentImage(imageUrl: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase || !imageUrl) return;

    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = imageUrl.split('/tournament-images/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      await supabase.storage
        .from('tournament-images')
        .remove([filePath]);
    } catch (err) {
      console.error('Error deleting tournament image:', err);
    }
  },

  // ==========================================
  // UTILS
  // ==========================================

  isConfigured(): boolean {
    return isSupabaseConfigured();
  }
};
