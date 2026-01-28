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
      flashcards: {
        Row: {
          created_at: string | null
          id: string
          module_id: string | null
          source_lang: string
          target_lang: string
          translation: string
          user_id: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id?: string | null
          source_lang?: string
          target_lang?: string
          translation: string
          user_id?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string | null
          source_lang?: string
          target_lang?: string
          translation?: string
          user_id?: string | null
          word?: string
        }
      }
      modules: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      quiz_results: {
        Row: {
          completed_at: string | null
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
      }
    }
  }
}
