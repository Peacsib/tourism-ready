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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_cache: {
        Row: {
          cache_key: string
          created_at: string
          results: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          results: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          results?: Json
        }
        Relationships: []
      }
      discovery_invitations: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          note: string | null
          professional_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          note?: string | null
          professional_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          note?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "external_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      external_professionals: {
        Row: {
          company: string | null
          headline: string | null
          id: string
          last_seen_at: string
          location: string | null
          name: string
          profile_url: string | null
          role: string | null
          source: string
        }
        Insert: {
          company?: string | null
          headline?: string | null
          id: string
          last_seen_at?: string
          location?: string | null
          name: string
          profile_url?: string | null
          role?: string | null
          source?: string
        }
        Update: {
          company?: string | null
          headline?: string | null
          id?: string
          last_seen_at?: string
          location?: string | null
          name?: string
          profile_url?: string | null
          role?: string | null
          source?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          job_id: string
          note: string
          passport: Json
          status: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          job_id: string
          note?: string
          passport?: Json
          status?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          job_id?: string
          note?: string
          passport?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          active: boolean
          closes_on: string | null
          created_at: string
          description: string
          employer_id: string
          id: string
          job_type: string
          location: string
          organisation: string
          skills: string[]
          title: string
        }
        Insert: {
          active?: boolean
          closes_on?: string | null
          created_at?: string
          description?: string
          employer_id: string
          id?: string
          job_type?: string
          location?: string
          organisation: string
          skills?: string[]
          title: string
        }
        Update: {
          active?: boolean
          closes_on?: string | null
          created_at?: string
          description?: string
          employer_id?: string
          id?: string
          job_type?: string
          location?: string
          organisation?: string
          skills?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_path: string | null
          linkedin_shared: boolean
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          linkedin_shared?: boolean
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_path?: string | null
          linkedin_shared?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_state: Json
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          goal: string | null
          headline: string | null
          id: string
          location: string | null
          organisation: string | null
          role: string
          updated_at: string
        }
        Insert: {
          app_state?: Json
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          goal?: string | null
          headline?: string | null
          id: string
          location?: string | null
          organisation?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          app_state?: Json
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          goal?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          organisation?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      sim_attempts: {
        Row: {
          added_to_passport: boolean
          competencies: Json
          created_at: string
          id: string
          scores: Json
          sim_id: string
          taken_on: string | null
          title: string
          user_id: string
        }
        Insert: {
          added_to_passport?: boolean
          competencies?: Json
          created_at?: string
          id: string
          scores?: Json
          sim_id: string
          taken_on?: string | null
          title: string
          user_id: string
        }
        Update: {
          added_to_passport?: boolean
          competencies?: Json
          created_at?: string
          id?: string
          scores?: Json
          sim_id?: string
          taken_on?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_competencies: {
        Row: {
          category: string
          competency_id: string
          level: number
          links: Json
          name: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          competency_id: string
          level?: number
          links?: Json
          name: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          competency_id?: string
          level?: number
          links?: Json
          name?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_timeline: {
        Row: {
          created_at: string
          detail: string | null
          entry_date: string | null
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          entry_date?: string | null
          id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          entry_date?: string | null
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_job_owner: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "student"
        | "professional"
        | "employer"
        | "educator"
        | "entrepreneur"
        | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "student",
        "professional",
        "employer",
        "educator",
        "entrepreneur",
        "admin",
      ],
    },
  },
} as const
