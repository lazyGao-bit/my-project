export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          role: string | null // 'admin' | 'creator'
          country: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          role?: string | null
          country?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          role?: string | null
          country?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      live_schedules: {
        Row: {
          id: number
          country: string
          shop_name: string
          date: string
          hour_slot: number
          anchor_id: string | null
          anchor_name: string | null
          fans_added: number | null
          created_at: string
        }
        Insert: {
          id?: number
          country: string
          shop_name: string
          date: string
          hour_slot: number
          anchor_id?: string | null
          anchor_name?: string | null
          fans_added?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          country?: string
          shop_name?: string
          date?: string
          hour_slot?: number
          anchor_id?: string | null
          anchor_name?: string | null
          fans_added?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_schedules_anchor_id_fkey"
            columns: ["anchor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedbacks: {
        Row: {
          id: number
          user_id: string | null
          content: string
          type: string | null
          is_public: boolean | null
          reply: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          content: string
          type?: string | null
          is_public?: boolean | null
          reply?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          content?: string
          type?: string | null
          is_public?: boolean | null
          reply?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
