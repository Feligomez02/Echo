import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these from Supabase)
export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          username: string
          password: string
          name: string | null
          bio: string | null
          image: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          password: string
          name?: string | null
          bio?: string | null
          image?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password?: string
          name?: string | null
          bio?: string | null
          image?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Show: {
        Row: {
          id: string
          name: string
          artist: string
          description: string | null
          date: string
          venue: string
          venueId: string | null
          city: string
          imageUrl: string | null
          ticketUrl: string | null
          source: string
          externalId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          artist: string
          description?: string | null
          date: string
          venue: string
          venueId?: string | null
          city?: string
          imageUrl?: string | null
          ticketUrl?: string | null
          source: string
          externalId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          artist?: string
          description?: string | null
          date?: string
          venue?: string
          venueId?: string | null
          city?: string
          imageUrl?: string | null
          ticketUrl?: string | null
          source?: string
          externalId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Review: {
        Row: {
          id: string
          userId: string
          showId: string
          rating: number
          text: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          showId: string
          rating: number
          text: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          showId?: string
          rating?: number
          text?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      // Add other tables as needed...
    }
  }
}