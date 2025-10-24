import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common queries
export async function getShowsFromSupabase(limit = 100) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image),
        likes:ReviewLike(*)
      )
    `)
    .gte('date', new Date().toISOString())
    .in('source', ['laestacion', 'lafabrica'])
    .order('date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getShowById(id: string) {
  const { data, error } = await supabase
    .from('Show')
    .select(`
      *,
      reviews:Review(
        *,
        user:User(id, username, name, image)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getReviewsForShow(showId: string) {
  const { data, error } = await supabase
    .from('Review')
    .select(`
      *,
      user:User(id, username, name, image),
      likes:ReviewLike(*)
    `)
    .eq('showId', showId)
    .order('createdAt', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('username', username)
    .single()

  if (error) throw error
  return data
}

export async function createReview(userId: string, showId: string, rating: number, text: string) {
  const reviewId = randomUUID();
  const { data, error } = await supabase
    .from('Review')
    .insert({
      id: reviewId,
      userId,
      showId,
      rating,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function addReviewLike(userId: string, reviewId: string, isLike: boolean) {
  const likeId = randomUUID();
  const { data, error } = await supabase
    .from('ReviewLike')
    .upsert({
      id: likeId,
      userId,
      reviewId,
      isLike,
      createdAt: new Date().toISOString()
    }, {
      onConflict: 'userId,reviewId'
    })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function addComment(userId: string, reviewId: string, text: string) {
  const commentId = randomUUID();
  const { data, error } = await supabase
    .from('Comment')
    .insert({
      id: commentId,
      userId,
      reviewId,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function followUser(followerId: string, followingId: string) {
  const friendshipId = randomUUID();
  const { data, error } = await supabase
    .from('Friendship')
    .upsert({
      id: friendshipId,
      followerId,
      followingId,
      status: 'accepted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, {
      onConflict: 'followerId,followingId'
    })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function getMutualFriends(userId: string) {
  const { data, error } = await supabase
    .from('Friendship')
    .select(`
      followingId,
      following:User!followingId(id, username, name, image)
    `)
    .eq('followerId', userId)
    .eq('status', 'accepted')

  if (error) throw error
  return data?.map(f => f.following) || []
}
