import { NextRequest } from 'next/server';
import {
  generateNonce,
  validateNonce,
  generateRequestSignature,
  verifyRequestSignature,
  isTimestampValid,
  validateRating,
  validateNumericParam,
} from './security';

/**
 * Middleware para validar requests críticas contra tampering
 * Uso: Agregar a endpoints que modifican datos importantes
 */
export async function validateSecureRequest(
  request: NextRequest,
  options: {
    requireNonce?: boolean;
    requireSignature?: boolean;
    requireTimestamp?: boolean;
    maxAge?: number;
  } = {}
) {
  const {
    requireNonce = false,
    requireSignature = false,
    requireTimestamp = true,
    maxAge = 5 * 60 * 1000, // 5 minutos por defecto
  } = options;

  const headers = request.headers;
  const errors: string[] = [];

  // 1. Validar timestamp para prevenir replay attacks
  if (requireTimestamp) {
    const timestamp = headers.get('x-timestamp');
    
    if (!timestamp) {
      errors.push('Missing timestamp header');
    } else {
      const ts = parseInt(timestamp, 10);
      if (!isTimestampValid(ts, maxAge)) {
        errors.push('Invalid or expired timestamp');
      }
    }
  }

  // 2. Validar nonce para prevenir replay attacks
  if (requireNonce) {
    const nonce = headers.get('x-nonce');
    
    if (!nonce) {
      errors.push('Missing nonce header');
    } else if (!validateNonce(nonce, maxAge)) {
      errors.push('Invalid or reused nonce (possible replay attack)');
    }
  }

  // 3. Validar firma HMAC para prevenir tampering
  if (requireSignature) {
    const signature = headers.get('x-signature');
    const body = await request.clone().json().catch(() => ({}));
    
    if (!signature) {
      errors.push('Missing signature header');
    } else {
      const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
      if (!verifyRequestSignature(body, signature, secret)) {
        errors.push('Invalid signature (possible tampering detected)');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida parámetros de una review contra tampering
 */
export function validateReviewParams(params: {
  rating: any;
  text: any;
  showId: any;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar rating
  const ratingValidation = validateRating(params.rating);
  if (!ratingValidation.valid) {
    errors.push(`Rating: ${ratingValidation.error}`);
  }

  // Validar text
  if (typeof params.text !== 'string') {
    errors.push('Text debe ser un string');
  } else {
    if (params.text.length < 10) {
      errors.push('Text muy corto (mínimo 10 caracteres)');
    }
    if (params.text.length > 1000) {
      errors.push('Text muy largo (máximo 1000 caracteres)');
    }
  }

  // Validar showId
  if (typeof params.showId !== 'string' || params.showId.length === 0) {
    errors.push('showId inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida parámetros de un comentario contra tampering
 */
export function validateCommentParams(params: {
  text: any;
  reviewId: any;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar text
  if (typeof params.text !== 'string') {
    errors.push('Text debe ser un string');
  } else {
    if (params.text.length < 1) {
      errors.push('Text vacío');
    }
    if (params.text.length > 500) {
      errors.push('Text muy largo (máximo 500 caracteres)');
    }
  }

  // Validar reviewId
  if (typeof params.reviewId !== 'string' || params.reviewId.length === 0) {
    errors.push('reviewId inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida parámetros de follow/unfollow contra tampering
 */
export function validateFollowParams(params: {
  action: any;
  username: any;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar action
  if (!['follow', 'unfollow'].includes(params.action)) {
    errors.push('Action debe ser "follow" o "unfollow"');
  }

  // Validar username
  if (typeof params.username !== 'string' || params.username.length === 0) {
    errors.push('Username inválido');
  } else {
    // Validar longitud
    if (params.username.length < 3 || params.username.length > 20) {
      errors.push('Username debe tener entre 3 y 20 caracteres');
    }
    
    // Validar caracteres permitidos
    if (!/^[a-zA-Z0-9_-]+$/.test(params.username)) {
      errors.push('Username contiene caracteres inválidos');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Genera headers seguros para el cliente
 * El cliente debe incluir estos headers en requests críticas
 */
export function generateSecureHeaders(body?: any): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Timestamp': Date.now().toString(),
    'X-Nonce': generateNonce(),
  };

  // Si hay body, generar firma
  if (body) {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    headers['X-Signature'] = generateRequestSignature(body, secret);
  }

  return headers;
}

/**
 * Helper para loguear intentos sospechosos
 */
export function logSuspiciousActivity(
  type: 'tampering' | 'replay' | 'csrf' | 'injection',
  details: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    params?: any;
    error?: string;
  }
) {
  const timestamp = new Date().toISOString();
  
  console.warn('🚨 SECURITY ALERT:', {
    type,
    timestamp,
    ...details,
  });

  // En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToSecurityMonitoring({ type, timestamp, ...details });
  // }
}
