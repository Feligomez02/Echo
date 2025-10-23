import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidOrigin } from './lib/security';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ============================================
  // PROTECCIÓN CONTRA PROXY ATTACKS
  // ============================================

  // 1. Validar origen para prevenir CSRF
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Solo validar en métodos que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const allowedOrigins = [
      process.env.NEXTAUTH_URL || 'http://localhost:3000',
      `https://${host}`,
      `http://${host}`,
    ];

    // Si viene con origin, validarlo
    if (origin && !isValidOrigin(origin, allowedOrigins)) {
      console.warn('⚠️  CSRF attempt detected:', { origin, referer, host });
      return NextResponse.json(
        { error: 'Origen no permitido' },
        { status: 403 }
      );
    }

    // Si no hay origin pero hay referer, validar referer
    if (!origin && referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        console.warn('⚠️  CSRF attempt detected (referer):', { referer, host });
        return NextResponse.json(
          { error: 'Referer inválido' },
          { status: 403 }
        );
      }
    }
  }

  // 2. Detectar User-Agents sospechosos (tools de hacking)
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /havij/i,
    /acunetix/i,
    /netsparker/i,
    /burp/i,
    /zap/i, // OWASP ZAP
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn('⚠️  Suspicious user-agent detected:', userAgent);
    return NextResponse.json(
      { error: 'Acceso denegado' },
      { status: 403 }
    );
  }

  // 3. Rate limiting por IP (protección adicional)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';

  // Bloquear IPs conocidas como maliciosas (ejemplo)
  const blockedIPs = ['127.0.0.1']; // Agregar IPs maliciosas aquí
  if (blockedIPs.includes(ip)) {
    console.warn('⚠️  Blocked IP attempted access:', ip);
    return NextResponse.json(
      { error: 'IP bloqueada' },
      { status: 403 }
    );
  }

  // ============================================
  // SECURITY HEADERS
  // ============================================

  // Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://cdn.jsdelivr.net;
    connect-src 'self';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
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
    'camera=(), microphone=(), geolocation=(), payment=()'
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

  // Remove headers que exponen información del servidor
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Cache-Control para evitar que datos sensibles se cacheen
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // X-Request-ID para tracking (útil para logs de seguridad)
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);

  // Feature-Policy adicional
  response.headers.set(
    'Feature-Policy',
    "accelerometer 'none'; camera 'none'; microphone 'none'; payment 'none'; usb 'none'"
  );

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
