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
      todo: {
        Row: {
          id: number
          text: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Todo = Database['public']['Tables']['todo']['Row']
