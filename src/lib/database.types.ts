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
          user_id: string | null
          workspace_id: number
        }
        Insert: {
          id?: number
          text: string
          completed?: boolean
          created_at?: string
          user_id?: string | null
          workspace_id: number
        }
        Update: {
          id?: number
          text?: string
          completed?: boolean
          created_at?: string
          user_id?: string | null
          workspace_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'todo_workspace_id_fkey'
            columns: ['workspace_id']
            referencedRelation: 'workspace'
            referencedColumns: ['id']
          },
        ]
      }
      workspace: {
        Row: {
          id: number
          name: string | null
          user_id: string | null
          created_at: string
          is_public: boolean | null
          password: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          user_id?: string | null
          created_at?: string
          is_public?: boolean | null
          password?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          user_id?: string | null
          created_at?: string
          is_public?: boolean | null
          password?: string | null
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
export type Workspace = Database['public']['Tables']['workspace']['Row']
export type WorkspaceInsert = Database['public']['Tables']['workspace']['Insert']
export type WorkspaceUpdate = Database['public']['Tables']['workspace']['Update']