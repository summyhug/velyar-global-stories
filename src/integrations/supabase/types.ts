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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      archived_prompts: {
        Row: {
          archive_date: string
          country_count: number
          created_at: string
          id: string
          prompt_text: string
          response_count: number
          updated_at: string
        }
        Insert: {
          archive_date: string
          country_count?: number
          created_at?: string
          id?: string
          prompt_text: string
          response_count?: number
          updated_at?: string
        }
        Update: {
          archive_date?: string
          country_count?: number
          created_at?: string
          id?: string
          prompt_text?: string
          response_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_appeals: {
        Row: {
          appeal_reason: string
          created_at: string
          id: string
          response: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          appeal_reason: string
          created_at?: string
          id?: string
          response?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id: string
          video_id: string
        }
        Update: {
          appeal_reason?: string
          created_at?: string
          id?: string
          response?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_appeals_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          video_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          video_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_prompts: {
        Row: {
          created_at: string
          date: string
          id: string
          is_active: boolean
          prompt_text: string
          theme_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_active?: boolean
          prompt_text: string
          theme_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean
          prompt_text?: string
          theme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_prompts_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      geographic_analysis: {
        Row: {
          analysis_date: string
          country_distribution: Json
          created_at: string
          diversity_score: number
          id: string
          recommended_targets: Json
          total_countries: number
          total_videos: number
          underrepresented_regions: Json
          updated_at: string
        }
        Insert: {
          analysis_date?: string
          country_distribution?: Json
          created_at?: string
          diversity_score?: number
          id?: string
          recommended_targets?: Json
          total_countries?: number
          total_videos?: number
          underrepresented_regions?: Json
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          country_distribution?: Json
          created_at?: string
          diversity_score?: number
          id?: string
          recommended_targets?: Json
          total_countries?: number
          total_videos?: number
          underrepresented_regions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      global_prompts: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          message_text: string
          priority: number
          start_date: string | null
          target_regions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          message_text: string
          priority?: number
          start_date?: string | null
          target_regions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          message_text?: string
          priority?: number
          start_date?: string | null
          target_regions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          location_needed: string | null
          participants_count: number
          target_regions: Json | null
          theme_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_needed?: string | null
          participants_count?: number
          target_regions?: Json | null
          theme_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_needed?: string | null
          participants_count?: number
          target_regions?: Json | null
          theme_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          automated: boolean | null
          created_at: string
          id: string
          moderator_id: string | null
          reason: string
          video_id: string
        }
        Insert: {
          action_type: string
          automated?: boolean | null
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason: string
          video_id: string
        }
        Update: {
          action_type?: string
          automated?: boolean | null
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          age_verified: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_status?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_status?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consent: {
        Row: {
          age_verification: boolean
          community_guidelines: boolean
          content_moderation: boolean
          created_at: string
          data_processing: boolean
          id: string
          marketing_emails: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age_verification?: boolean
          community_guidelines?: boolean
          content_moderation?: boolean
          created_at?: string
          data_processing?: boolean
          id?: string
          marketing_emails?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age_verification?: boolean
          community_guidelines?: boolean
          content_moderation?: boolean
          created_at?: string
          data_processing?: boolean
          id?: string
          marketing_emails?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_overlays: {
        Row: {
          content: string
          created_at: string
          id: string
          overlay_type: string
          position_x: number
          position_y: number
          style_data: Json | null
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          overlay_type: string
          position_x: number
          position_y: number
          style_data?: Json | null
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          overlay_type?: string
          position_x?: number
          position_y?: number
          style_data?: Json | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_overlays_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_themes: {
        Row: {
          created_at: string
          id: string
          theme_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          theme_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          theme_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_themes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          daily_prompt_id: string | null
          description: string | null
          duration: number | null
          id: string
          is_hidden: boolean | null
          is_public: boolean
          language: string | null
          location: string | null
          mission_id: string | null
          moderation_status: string | null
          removal_reason: string | null
          report_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          daily_prompt_id?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_hidden?: boolean | null
          is_public?: boolean
          language?: string | null
          location?: string | null
          mission_id?: string | null
          moderation_status?: string | null
          removal_reason?: string | null
          report_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          daily_prompt_id?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_hidden?: boolean | null
          is_public?: boolean
          language?: string | null
          location?: string | null
          mission_id?: string | null
          moderation_status?: string | null
          removal_reason?: string | null
          report_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_daily_prompt_id_fkey"
            columns: ["daily_prompt_id"]
            isOneToOne: false
            referencedRelation: "daily_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fix_user_profile_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      get_full_profile: {
        Args: { profile_user_id: string }
        Returns: {
          account_status: string
          age_verified: boolean
          avatar_url: string
          bio: string
          city: string
          country: string
          created_at: string
          date_of_birth: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          user_id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
