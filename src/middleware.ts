import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  
  // Content Security Policy (CSP)
  // Protege contra XSS al controlar qué recursos pueden cargarse
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://cdn.jsdelivr.net;
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // X-Frame-Options: Previene clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options: Previene MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy: Controla qué información de referrer se envía
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Controla qué features del navegador se permiten
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Strict-Transport-Security (HSTS): Fuerza HTTPS (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-XSS-Protection: Protección XSS legacy para navegadores antiguos
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Remove Server header para no exponer información del servidor
  response.headers.delete('X-Powered-By');

  return response;
}

// Configurar qué rutas ejecutan el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
