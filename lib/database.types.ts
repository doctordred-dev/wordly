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
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          translation: string
          source_lang: string
          target_lang: string
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          translation?: string
          source_lang?: string
          target_lang?: string
          created_at?: string
        }
      }
    }
  }
}
