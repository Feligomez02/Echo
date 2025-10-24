import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { supabase } from './supabase';
import { isValidCuid } from './security';

/**
 * Verifica que el usuario autenticado sea el dueño de un recurso
 * Previene ataques IDOR (Insecure Direct Object Reference)
 */
export async function verifyResourceOwnership(
  resourceType: 'review' | 'comment' | 'user',
  resourceId: string
): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false, error: 'No autenticado' };
  }

  const userId = (session.user as any).id;

  // Validar formato de ID para prevenir injection
  if (!isValidCuid(resourceId)) {
    return { authorized: false, error: 'ID inválido' };
  }

  try {
    switch (resourceType) {
      case 'review': {
        const { data: review, error } = await supabase
          .from('Review')
          .select('userId')
          .eq('id', resourceId)
          .single();

        if (error || !review) {
          return { authorized: false, error: 'Review no encontrada' };
        }

        return {
          authorized: review.userId === userId,
          userId,
          error: review.userId !== userId ? 'No autorizado' : undefined,
        };
      }

      case 'comment': {
        const { data: comment, error } = await supabase
          .from('Comment')
          .select('userId')
          .eq('id', resourceId)
          .single();

        if (error || !comment) {
          return { authorized: false, error: 'Comentario no encontrado' };
        }

        return {
          authorized: comment.userId === userId,
          userId,
          error: comment.userId !== userId ? 'No autorizado' : undefined,
        };
      }

      case 'user': {
        return {
          authorized: resourceId === userId,
          userId,
          error: resourceId !== userId ? 'No autorizado' : undefined,
        };
      }

      default:
        return { authorized: false, error: 'Tipo de recurso inválido' };
    }
  } catch (error) {
    console.error('Error verificando ownership:', error);
    return { authorized: false, error: 'Error interno' };
  }
}

/**
 * Verifica que dos usuarios sean amigos mutuos
 * Previene acceso no autorizado a funcionalidades de amigos
 */
export async function verifyMutualFriendship(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    // Validar formato de IDs
    if (!isValidCuid(userId1) || !isValidCuid(userId2)) {
      return false;
    }

    const { data: friendship1, error: error1 } = await supabase
      .from('Friendship')
      .select('status')
      .eq('followerId', userId1)
      .eq('followingId', userId2)
      .single();

    const { data: friendship2, error: error2 } = await supabase
      .from('Friendship')
      .select('status')
      .eq('followerId', userId2)
      .eq('followingId', userId1)
      .single();

    return (
      !error1 &&
      !error2 &&
      friendship1?.status === 'accepted' &&
      friendship2?.status === 'accepted'
    );
  } catch (error) {
    console.error('Error verificando amistad mutua:', error);
    return false;
  }
}

/**
 * Obtiene el ID del usuario autenticado de forma segura
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const userId = (session.user as any).id;

  // Validar que el ID sea válido
  if (!userId || !isValidCuid(userId)) {
    return null;
  }

  return userId;
}

/**
 * Verifica que el usuario tenga permisos para realizar una acción
 */
export async function checkPermission(
  action: 'create_review' | 'comment_review' | 'like_review' | 'follow_user',
  context: {
    targetUserId?: string;
    reviewId?: string;
    showId?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return { allowed: false, reason: 'No autenticado' };
  }

  try {
    switch (action) {
      case 'create_review': {
        if (!context.showId) {
          return { allowed: false, reason: 'Show ID requerido' };
        }

        // Verificar que no tenga ya una review de este show
        const { data: existingReview } = await supabase
          .from('Review')
          .select('id')
          .eq('userId', userId)
          .eq('showId', context.showId)
          .single();

        if (existingReview) {
          return {
            allowed: false,
            reason: 'Ya has revieweado este show',
          };
        }

        return { allowed: true };
      }

      case 'comment_review': {
        if (!context.reviewId) {
          return { allowed: false, reason: 'Review ID requerido' };
        }

        const { data: review, error: reviewError } = await supabase
          .from('Review')
          .select('userId')
          .eq('id', context.reviewId)
          .single();

        if (reviewError || !review) {
          return { allowed: false, reason: 'Review no encontrada' };
        }

        // Si es su propia review, puede comentar
        if (review.userId === userId) {
          return { allowed: true };
        }

        // Si no, verificar amistad mutua
        const areMutualFriends = await verifyMutualFriendship(
          userId,
          review.userId
        );

        if (!areMutualFriends) {
          return {
            allowed: false,
            reason: 'Solo amigos mutuos pueden comentar',
          };
        }

        return { allowed: true };
      }

      case 'like_review': {
        // Cualquier usuario autenticado puede dar like
        return { allowed: true };
      }

      case 'follow_user': {
        if (!context.targetUserId) {
          return { allowed: false, reason: 'User ID requerido' };
        }

        // No puede seguirse a sí mismo
        if (context.targetUserId === userId) {
          return { allowed: false, reason: 'No puedes seguirte a ti mismo' };
        }

        return { allowed: true };
      }

      default:
        return { allowed: false, reason: 'Acción inválida' };
    }
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return { allowed: false, reason: 'Error interno' };
  }
}
