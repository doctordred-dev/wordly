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
      flashcards: {
        Row: {
          id: string
          word: string
          translation: string
          source_lang: string
          target_lang: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          translation: string
          source_lang: string
          target_lang: string
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          translation?: string
          source_lang?: string
          target_lang?: string
          user_id?: string
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          score: number
          total_questions: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          total_questions: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          total_questions?: number
          completed_at?: string
        }
      }
    }
  }
}
