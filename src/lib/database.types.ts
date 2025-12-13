export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_standings: {
        Row: {
          created_at: string
          drawn: number
          group_id: string
          id: string
          lost: number
          participant_id: string
          played: number
          points: number
          points_against: number
          points_for: number
          updated_at: string
          won: number
        }
        Insert: {
          created_at?: string
          drawn?: number
          group_id: string
          id?: string
          lost?: number
          participant_id: string
          played?: number
          points?: number
          points_against?: number
          points_for?: number
          updated_at?: string
          won?: number
        }
        Update: {
          created_at?: string
          drawn?: number
          group_id?: string
          id?: string
          lost?: number
          participant_id?: string
          played?: number
          points?: number
          points_against?: number
          points_for?: number
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_standings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_standings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          best_of: number | null
          bracket: string | null
          completed_at: string | null
          created_at: string
          games: Json | null
          group_id: string | null
          id: string
          loser_id: string | null
          metadata: Json | null
          participant1_id: string | null
          participant2_id: string | null
          phase: string | null
          position: number
          round: number
          scheduled_at: string | null
          score_participant1: number | null
          score_participant2: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          best_of?: number | null
          bracket?: string | null
          completed_at?: string | null
          created_at?: string
          games?: Json | null
          group_id?: string | null
          id?: string
          loser_id?: string | null
          metadata?: Json | null
          participant1_id?: string | null
          participant2_id?: string | null
          phase?: string | null
          position: number
          round: number
          scheduled_at?: string | null
          score_participant1?: number | null
          score_participant2?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          best_of?: number | null
          bracket?: string | null
          completed_at?: string | null
          created_at?: string
          games?: Json | null
          group_id?: string | null
          id?: string
          loser_id?: string | null
          metadata?: Json | null
          participant1_id?: string | null
          participant2_id?: string | null
          phase?: string | null
          position?: number
          round?: number
          scheduled_at?: string | null
          score_participant1?: number | null
          score_participant2?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_statuses: {
        Row: {
          created_at: string
          eliminated_at: string | null
          elimination_reason: string | null
          forfeit_match_id: string | null
          id: string
          is_eliminated: boolean
          original_match_state: Json | null
          participant_id: string
          promoted_opponent_id: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eliminated_at?: string | null
          elimination_reason?: string | null
          forfeit_match_id?: string | null
          id?: string
          is_eliminated?: boolean
          original_match_state?: Json | null
          participant_id: string
          promoted_opponent_id?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eliminated_at?: string | null
          elimination_reason?: string | null
          forfeit_match_id?: string | null
          id?: string
          is_eliminated?: boolean
          original_match_state?: Json | null
          participant_id?: string
          promoted_opponent_id?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_statuses_forfeit_match_id_fkey"
            columns: ["forfeit_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_statuses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_statuses_promoted_opponent_id_fkey"
            columns: ["promoted_opponent_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_statuses_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_statuses_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string
          seed: number | null
          team: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          seed?: number | null
          team?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          seed?: number | null
          team?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          points: number
          reason: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          points: number
          reason: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          points?: number
          reason?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalties_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalties_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_events: {
        Row: {
          created_at: string
          data: Json | null
          description: string
          id: string
          tournament_id: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description: string
          id?: string
          tournament_id: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string
          id?: string
          tournament_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_events_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_events_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category: string | null
          completed_at: string | null
          config: Json
          created_at: string
          description: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          game: string | null
          id: string
          image_url: string | null
          name: string
          registration_end_date: string | null
          registration_open: boolean | null
          scheduled_start_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          tags: string[] | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          game?: string | null
          id?: string
          image_url?: string | null
          name: string
          registration_end_date?: string | null
          registration_open?: boolean | null
          scheduled_start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          tags?: string[] | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          game?: string | null
          id?: string
          image_url?: string | null
          name?: string
          registration_end_date?: string | null
          registration_open?: boolean | null
          scheduled_start_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          tags?: string[] | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      group_standings_with_names: {
        Row: {
          created_at: string | null
          drawn: number | null
          goal_difference: number | null
          group_id: string | null
          group_name: string | null
          id: string | null
          lost: number | null
          participant_id: string | null
          participant_name: string | null
          played: number | null
          points: number | null
          points_against: number | null
          points_for: number | null
          updated_at: string | null
          won: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_standings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_standings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments_with_stats: {
        Row: {
          category: string | null
          completed_at: string | null
          completed_match_count: number | null
          config: Json | null
          created_at: string | null
          description: string | null
          format: Database["public"]["Enums"]["tournament_format"] | null
          game: string | null
          id: string | null
          match_count: number | null
          name: string | null
          participant_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"] | null
          tags: string[] | null
          updated_at: string | null
          winner_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      recalculate_group_standings: {
        Args: { p_group_id: string }
        Returns: undefined
      }
    }
    Enums: {
      currency_type: "€" | "£" | "$" | "points"
      match_status: "pending" | "in_progress" | "completed" | "cancelled"
      seeding_type: "random" | "manual" | "ranked"
      tournament_format:
        | "single_elimination"
        | "double_elimination"
        | "groups"
        | "championship"
      tournament_status:
        | "draft"
        | "registration"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_type: ["€", "£", "$", "points"],
      match_status: ["pending", "in_progress", "completed", "cancelled"],
      seeding_type: ["random", "manual", "ranked"],
      tournament_format: [
        "single_elimination",
        "double_elimination",
        "groups",
        "championship",
      ],
      tournament_status: [
        "draft",
        "registration",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
