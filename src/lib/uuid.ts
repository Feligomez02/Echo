import { randomUUID } from 'crypto';

/**
 * Función para generar UUIDs v4
 * Compatible con PostgreSQL UUID type
 */
export function generateUUID(): string {
  return randomUUID();
}

