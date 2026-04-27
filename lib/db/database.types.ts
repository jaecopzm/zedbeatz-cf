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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          artist_id: number | null
          cover_key: string | null
          created_at: string | null
          id: number
          release_year: number | null
          slug: string | null
          title: string
        }
        Insert: {
          artist_id?: number | null
          cover_key?: string | null
          created_at?: string | null
          id?: number
          release_year?: number | null
          slug?: string | null
          title: string
        }
        Update: {
          artist_id?: number | null
          cover_key?: string | null
          created_at?: string | null
          id?: number
          release_year?: number | null
          slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string | null
          id: number
          image_key: string | null
          name: string
          slug: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: number
          image_key?: string | null
          name: string
          slug?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: number
          image_key?: string | null
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: number
          track_id: number
          user_id: string
          user_name: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: number
          track_id: number
          user_id: string
          user_name: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: number
          track_id?: number
          user_id?: string
          user_name?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          id: number
          user_id: string
          artist_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          artist_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          artist_id?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_tracks: {
        Row: {
          created_at: string | null
          id: number
          position: number
          track_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          position?: number
          track_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          position?: number
          track_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "hero_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          playlist_id: number
          position: number
          track_id: number
        }
        Insert: {
          playlist_id: number
          position?: number
          track_id: number
        }
        Update: {
          playlist_id?: number
          position?: number
          track_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          category: string | null
          cover_key: string | null
          created_at: string | null
          id: number
          is_featured: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cover_key?: string | null
          created_at?: string | null
          id?: number
          is_featured?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cover_key?: string | null
          created_at?: string | null
          id?: number
          is_featured?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recently_played: {
        Row: {
          id: number
          played_at: string | null
          track_id: number | null
          user_id: string | null
        }
        Insert: {
          id?: number
          played_at?: string | null
          track_id?: number | null
          user_id?: string | null
        }
        Update: {
          id?: number
          played_at?: string | null
          track_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recently_played_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_playlists: {
        Row: {
          created_at: string | null
          playlist_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          playlist_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          playlist_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_playlists_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: number | null
          artist_id: number | null
          audio_key: string
          cover_key: string | null
          created_at: string | null
          duration: number | null
          featured_artists: string | null
          genre: string | null
          id: number
          lyrics: string | null
          plays: number | null
          slug: string | null
          synced_lyrics: string | null
          title: string
        }
        Insert: {
          album_id?: number | null
          artist_id?: number | null
          audio_key: string
          cover_key?: string | null
          created_at?: string | null
          duration?: number | null
          featured_artists?: string | null
          genre?: string | null
          id?: number
          lyrics?: string | null
          plays?: number | null
          slug?: string | null
          synced_lyrics?: string | null
          title: string
        }
        Update: {
          album_id?: number | null
          artist_id?: number | null
          audio_key?: string
          cover_key?: string | null
          created_at?: string | null
          duration?: number | null
          featured_artists?: string | null
          genre?: string | null
          id?: number
          lyrics?: string | null
          plays?: number | null
          slug?: string | null
          synced_lyrics?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_plays:
        | {
            Args: { track_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.increment_plays(track_id => int8), public.increment_plays(track_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { track_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.increment_plays(track_id => int8), public.increment_plays(track_id => int4). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
