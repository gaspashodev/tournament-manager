// Types générés automatiquement par Supabase
// Régénérer avec: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string
          name: string
          description: string | null
          format: 'single_elimination' | 'double_elimination' | 'groups' | 'championship'
          status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          game: string | null
          category: string | null
          tags: string[] | null
          winner_id: string | null
          config: Json
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          format: 'single_elimination' | 'double_elimination' | 'groups' | 'championship'
          status?: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          game?: string | null
          category?: string | null
          tags?: string[] | null
          winner_id?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          format?: 'single_elimination' | 'double_elimination' | 'groups' | 'championship'
          status?: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          game?: string | null
          category?: string | null
          tags?: string[] | null
          winner_id?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      participants: {
        Row: {
          id: string
          tournament_id: string
          name: string
          email: string | null
          seed: number | null
          team: string | null
          avatar_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          email?: string | null
          seed?: number | null
          team?: string | null
          avatar_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          email?: string | null
          seed?: number | null
          team?: string | null
          avatar_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          tournament_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_participants: {
        Row: {
          group_id: string
          participant_id: string
        }
        Insert: {
          group_id: string
          participant_id: string
        }
        Update: {
          group_id?: string
          participant_id?: string
        }
      }
      group_standings: {
        Row: {
          id: string
          group_id: string
          participant_id: string
          played: number
          won: number
          drawn: number
          lost: number
          points_for: number
          points_against: number
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          participant_id: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          points_for?: number
          points_against?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          participant_id?: string
          played?: number
          won?: number
          drawn?: number
          lost?: number
          points_for?: number
          points_against?: number
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          group_id: string | null
          round: number
          position: number
          participant1_id: string | null
          participant2_id: string | null
          winner_id: string | null
          score_participant1: number | null
          score_participant2: number | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          group_id?: string | null
          round: number
          position: number
          participant1_id?: string | null
          participant2_id?: string | null
          winner_id?: string | null
          score_participant1?: number | null
          score_participant2?: number | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          group_id?: string | null
          round?: number
          position?: number
          participant1_id?: string | null
          participant2_id?: string | null
          winner_id?: string | null
          score_participant1?: number | null
          score_participant2?: number | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      penalties: {
        Row: {
          id: string
          tournament_id: string
          participant_id: string
          points: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          participant_id: string
          points: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          participant_id?: string
          points?: number
          reason?: string
          created_at?: string
        }
      }
      participant_statuses: {
        Row: {
          id: string
          tournament_id: string
          participant_id: string
          is_eliminated: boolean
          eliminated_at: string | null
          elimination_reason: string | null
          last_opponent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          participant_id: string
          is_eliminated?: boolean
          eliminated_at?: string | null
          elimination_reason?: string | null
          last_opponent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          participant_id?: string
          is_eliminated?: boolean
          eliminated_at?: string | null
          elimination_reason?: string | null
          last_opponent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cashprize_distributions: {
        Row: {
          id: string
          tournament_id: string
          place: number
          percent: number
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          place: number
          percent: number
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          place?: number
          percent?: number
          created_at?: string
        }
      }
      cashprize_ranges: {
        Row: {
          id: string
          tournament_id: string
          start_place: number
          end_place: number
          percent: number
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          start_place: number
          end_place: number
          percent: number
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          start_place?: number
          end_place?: number
          percent?: number
          created_at?: string
        }
      }
      material_prizes: {
        Row: {
          id: string
          tournament_id: string
          place: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          place: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          place?: number
          description?: string
          created_at?: string
        }
      }
      material_prize_ranges: {
        Row: {
          id: string
          tournament_id: string
          start_place: number
          end_place: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          start_place: number
          end_place: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          start_place?: number
          end_place?: number
          description?: string
          created_at?: string
        }
      }
    }
    Views: {
      tournaments_with_stats: {
        Row: {
          id: string
          name: string
          description: string | null
          format: 'single_elimination' | 'double_elimination' | 'groups' | 'championship'
          status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          participant_count: number
          match_count: number
          completed_match_count: number
          created_at: string
          updated_at: string
        }
      }
      group_standings_with_names: {
        Row: {
          id: string
          group_id: string
          participant_id: string
          participant_name: string
          group_name: string
          played: number
          won: number
          drawn: number
          lost: number
          points_for: number
          points_against: number
          points: number
          goal_difference: number
        }
      }
    }
    Functions: {
      recalculate_group_standings: {
        Args: { p_group_id: string }
        Returns: void
      }
    }
  }
}
