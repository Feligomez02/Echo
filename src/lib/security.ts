import DOMPurify from 'dompurify';

/**
 * Sanitiza input de usuario para prevenir XSS e inyecciones
 * - Previene XSS: remueve tags HTML y event handlers
 * - Previene inyecciones: no usa eval, no concatena SQL (Supabase usa parameterized queries)
 * - Previene ataques: limita longitud, remueve caracteres peligrosos
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  return dirty
    .trim()
    // Prevenir XSS: remover tags HTML
    .replace(/[<>]/g, '')
    // Prevenir event handlers: onclick=, onerror=, etc
    .replace(/on\w+\s*=/gi, '')
    // Prevenir javascript: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remover caracteres de control
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limitar longitud para prevenir DoS
    .substring(0, 1000);
}

/**
 * Sanitiza texto plano
 * Escapa caracteres HTML pero preserva el texto
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida y sanitiza username
 * Solo permite letras, números, guiones y guiones bajos
 */
export function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Previene inyección de código en búsquedas
 */
export function sanitizeSearchQuery(query: string): string {
  // Remover caracteres especiales que podrían usarse en SQL injection
  return query
    .replace(/[;'"\\]/g, '')
    .trim()
    .slice(0, 100); // Limitar longitud
}

/**
 * Valida email de forma segura
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida que un ID sea un UUID o CUID válido
 * - UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - CUID: c[a-z0-9]{24}
 */
export function isValidCuid(id: string): boolean {
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // CUID format (legacy)
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return uuidRegex.test(id) || cuidRegex.test(id);
}

/**
 * Rate limiting simple usando memoria
 * En producción, usar Redis (Upstash)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Limpiar registros viejos
  if (record && now > record.resetTime) {
    rateLimitMap.delete(identifier);
  }

  const current = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  rateLimitMap.set(identifier, current);

  return { allowed: true, remaining: maxRequests - current.count };
}

/**
 * Genera un token CSRF seguro
 */
export function generateCsrfToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback para servidor
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida longitud de contraseña de forma segura
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  // Opcional: caracteres especiales
  // if (!/[!@#$%^&*]/.test(password)) {
  //   errors.push('Debe contener al menos un caracter especial');
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Limpia metadata peligrosa de objetos
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Previene timing attacks en comparación de strings
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Genera un nonce único para prevenir replay attacks
 * El nonce debe ser validado y marcado como usado después de cada request
 */
export function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Almacena nonces usados (in-memory, usar Redis en producción)
 */
const usedNonces = new Map<string, number>();

/**
 * Valida que un nonce no haya sido usado antes (previene replay attacks)
 * @param nonce - El nonce a validar
 * @param maxAge - Tiempo en ms antes de expirar (default: 5 minutos)
 */
export function validateNonce(nonce: string, maxAge: number = 5 * 60 * 1000): boolean {
  const now = Date.now();

  // Limpiar nonces expirados
  Array.from(usedNonces.entries()).forEach(([key, timestamp]) => {
    if (now - timestamp > maxAge) {
      usedNonces.delete(key);
    }
  });

  // Si el nonce ya fue usado, es un replay attack
  if (usedNonces.has(nonce)) {
    return false;
  }

  // Marcar como usado
  usedNonces.set(nonce, now);
  return true;
}

/**
 * Valida que los parámetros críticos no hayan sido modificados
 * Genera un HMAC de los parámetros para verificar integridad
 */
export function generateRequestSignature(
  params: Record<string, any>,
  secret: string
): string {
  const crypto = require('crypto');
  const data = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifica la firma de una request para detectar tampering
 */
export function verifyRequestSignature(
  params: Record<string, any>,
  signature: string,
  secret: string
): boolean {
  const expected = generateRequestSignature(params, secret);
  return secureCompare(expected, signature);
}

/**
 * Valida que un timestamp no sea muy antiguo (previene replay attacks)
 * @param timestamp - Unix timestamp en milisegundos
 * @param maxAge - Edad máxima permitida en ms (default: 5 minutos)
 */
export function isTimestampValid(timestamp: number, maxAge: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const age = now - timestamp;
  
  // No puede ser del futuro (clock skew máximo: 1 minuto)
  if (age < -60000) {
    return false;
  }
  
  // No puede ser muy antiguo
  if (age > maxAge) {
    return false;
  }
  
  return true;
}

/**
 * Valida el origen de la request para prevenir CSRF
 */
export function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      // Wildcard subdomain: *.example.com
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}

/**
 * Extrae y valida el User-Agent para detectar bots maliciosos
 */
export function isValidUserAgent(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }

  // Lista de user agents sospechosos
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i,
    /insomnia/i,
    /^$/,
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Valida parámetros numéricos para prevenir parameter tampering
 */
export function validateNumericParam(
  value: any,
  min?: number,
  max?: number
): { valid: boolean; error?: string } {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: 'Debe ser un número' };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Debe ser mayor o igual a ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Debe ser menor o igual a ${max}` };
  }

  return { valid: true };
}

/**
 * Valida que un rating sea válido (previene tampering del cliente)
 */
export function validateRating(rating: any): { valid: boolean; error?: string } {
  const validation = validateNumericParam(rating, 1, 5);
  if (!validation.valid) {
    return validation;
  }

  const num = Number(rating);
  
  // Solo permitir incrementos de 0.5
  if (num % 0.5 !== 0) {
    return { valid: false, error: 'El rating debe ser múltiplo de 0.5' };
  }

  return { valid: true };
}
