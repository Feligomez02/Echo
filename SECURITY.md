# 🔒 Seguridad - Reviews de Shows Córdoba

## Resumen de Implementación

Este documento describe todas las medidas de seguridad implementadas en la aplicación para prevenir vulnerabilidades comunes.

---

## 🛡️ Protecciones Implementadas

### 1. **Prevención de XSS (Cross-Site Scripting)**

#### ✅ Implementado en:
- **Biblioteca**: `DOMPurify` (isomorphic-dompurify para SSR)
- **Función**: `sanitizeHtml()` en `src/lib/security.ts`
- **Aplicado en**:
  - Reviews (`/api/reviews`)
  - Comentarios (`/api/reviews/[id]/comments`)
  - Perfiles de usuario (nombre, bio)

#### Configuración:
```typescript
sanitizeHtml(content, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})
```

**Tags HTML permitidos**: negrita, cursiva, énfasis, enlaces seguros
**Tags bloqueados**: `<script>`, `<iframe>`, `<object>`, eventos inline (`onclick`, etc.)

---

### 2. **Prevención de SQL Injection**

#### ✅ Implementado:
- **ORM**: Prisma con queries parametrizadas
- **Validación**: Zod schemas en todos los endpoints
- **Sanitización**: `sanitizeSearchQuery()` para búsquedas
- **Validación de IDs**: `isValidCuid()` para validar formato de IDs de Prisma

#### Protección automática:
```typescript
// ✅ SEGURO - Prisma usa prepared statements
await prisma.review.findMany({
  where: { userId: sanitizedUserId }
})

// ❌ PELIGROSO (no usado en esta app)
await prisma.$queryRaw`SELECT * FROM reviews WHERE userId = ${userId}`
```

**Todas las queries de Prisma son seguras por diseño** contra SQL injection.

---

### 3. **Protección IDOR (Insecure Direct Object Reference)**

#### ✅ Implementado en:
- **Archivo**: `src/lib/authorization.ts`
- **Funciones**:
  - `verifyResourceOwnership()` - Verifica que el usuario sea dueño del recurso
  - `checkPermission()` - Verifica permisos específicos
  - `verifyMutualFriendship()` - Valida amistad mutua

#### Aplicado en:
- **Edición/eliminación de reviews**: Solo el autor puede editar/eliminar
- **Comentarios**: Solo amigos mutuos o autor de la review pueden comentar
- **Perfiles**: Solo el dueño puede editar su perfil
- **Likes**: Cualquier usuario autenticado (validación de sesión)

#### Ejemplo de uso:
```typescript
// Verificar ownership antes de editar review
const { authorized, error } = await verifyResourceOwnership('review', reviewId);
if (!authorized) {
  return NextResponse.json({ error }, { status: 403 });
}
```

---

### 4. **Rate Limiting**

#### ✅ Implementado:
- **Función**: `checkRateLimit()` en `src/lib/security.ts`
- **Almacenamiento**: In-memory Map (para desarrollo)
- **Producción recomendada**: Redis o Upstash

#### Límites por endpoint:
| Endpoint | Límite | Ventana | Identificador |
|----------|--------|---------|---------------|
| Registro | 5 requests | 1 hora | IP |
| Login | 10 requests | 1 hora | IP |
| Crear review | 20 requests | 1 hora | User ID |
| Crear comentario | 30 requests | 1 hora | User ID |
| Follow/Unfollow | 50 requests | 1 hora | User ID |

#### Implementación:
```typescript
const rateLimitKey = `review_create_${userId}`;
if (!checkRateLimit(rateLimitKey, 20, 60 * 60 * 1000)) {
  return NextResponse.json(
    { error: 'Demasiadas reviews. Intenta más tarde.' },
    { status: 429 }
  );
}
```

---

### 5. **Autenticación Fortificada**

#### ✅ Implementado:
- **NextAuth.js 4.24.5** con JWT strategy
- **Hashing**: bcrypt con 12 rounds (incrementado desde 10)
- **Validación de contraseñas fuertes**: `isStrongPassword()`
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
- **Validación de emails**: `isValidEmail()` con regex
- **Comparación segura**: `secureCompare()` para prevenir timing attacks

#### Contraseña segura:
```typescript
function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
```

---

### 6. **Security Headers**

#### ✅ Implementado en: `src/middleware.ts`

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Content-Security-Policy` | Restringido | Previene XSS y data injection |
| `X-Frame-Options` | DENY | Previene clickjacking |
| `X-Content-Type-Options` | nosniff | Previene MIME sniffing |
| `Referrer-Policy` | strict-origin-when-cross-origin | Controla información de referrer |
| `Strict-Transport-Security` | max-age=31536000 | Fuerza HTTPS (producción) |
| `X-XSS-Protection` | 1; mode=block | Protección XSS legacy |
| `Permissions-Policy` | Restrictivo | Bloquea camera, microphone, geolocation |

#### CSP configurado:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
img-src 'self' data: https: blob:;
frame-ancestors 'none';
```

**Nota**: `unsafe-inline` y `unsafe-eval` son necesarios para Next.js en desarrollo. En producción, considera usar nonces.

---

### 7. **Validación y Sanitización de Inputs**

#### ✅ Funciones implementadas:

| Función | Uso | Previene |
|---------|-----|----------|
| `sanitizeHtml()` | Reviews, comentarios | XSS |
| `sanitizeText()` | Nombres, bio | XSS en texto plano |
| `sanitizeUsername()` | Usernames | Caracteres especiales |
| `sanitizeSearchQuery()` | Búsquedas | SQL injection |
| `isValidEmail()` | Emails | Formato inválido |
| `isValidCuid()` | IDs de Prisma | Formato inválido |
| `sanitizeObject()` | Objects con keys | Mass assignment |

#### Ejemplo completo:
```typescript
// 1. Validar con Zod
const { text } = reviewSchema.parse(body);

// 2. Sanitizar HTML
const sanitizedText = sanitizeHtml(text);

// 3. Guardar en DB
await prisma.review.create({
  data: { text: sanitizedText }
});
```

---

## 📋 Checklist de Seguridad

### Vulnerabilidades Web (OWASP Top 10)

- [x] **A01:2021 – Broken Access Control** (IDOR prevention)
- [x] **A03:2021 – Injection** (SQL Injection via Prisma + sanitización)
- [x] **A03:2021 – Injection** (XSS via DOMPurify)
- [x] **A05:2021 – Security Misconfiguration** (Security headers)
- [x] **A07:2021 – Identification and Authentication Failures** (Strong passwords, rate limiting)
- [ ] **A04:2021 – Insecure Design** (Requiere análisis de amenazas)
- [ ] **A06:2021 – Vulnerable and Outdated Components** (Actualizar regularmente)
- [ ] **A08:2021 – Software and Data Integrity Failures** (CSRF tokens pendiente)
- [ ] **A09:2021 – Security Logging and Monitoring Failures** (Logs pendiente)
- [ ] **A10:2021 – Server-Side Request Forgery (SSRF)** (No aplica actualmente)

---

## � Cómo Protegerse de Proxy Attacks (Burp Suite, OWASP ZAP, etc.)

### **Escenario de Ataque**

Un atacante configura un proxy interceptor (Burp Suite, OWASP ZAP, Charles Proxy) entre su navegador y tu servidor:

```
Cliente → [PROXY] → Servidor
          ↑
    Atacante puede:
    - Ver todas las requests
    - Modificar parámetros
    - Reusar requests
    - Eliminar validaciones
```

### **Defensas Implementadas (Capas de Seguridad)**

#### **Capa 1: Detección de Herramientas**
```typescript
// middleware-enhanced.ts
// Detecta User-Agents de herramientas conocidas
if (/burp|zap|sqlmap|nikto/.test(userAgent)) {
  return 403; // Bloqueado
}
```
⚠️ **Limitación**: Atacante puede modificar User-Agent

#### **Capa 2: Validación Server-Side Estricta**
```typescript
// NUNCA confiar en el cliente
// SIEMPRE validar en el servidor

// ❌ MAL: Confiar en validación del cliente
if (rating >= 1 && rating <= 5) { /* Cliente puede bypassear */ }

// ✅ BIEN: Validar en servidor
const validation = validateRating(rating);
if (!validation.valid) {
  logSuspiciousActivity('tampering', { ip, params });
  return 400;
}
```
✅ **Efectivo contra**: Parameter tampering

#### **Capa 3: Timestamps + Nonces (Replay Protection)**
```typescript
// Cliente genera headers únicos
const headers = {
  'X-Timestamp': Date.now(),
  'X-Nonce': generateNonce(), // Token único de 32 bytes
};

// Servidor valida
if (!isTimestampValid(timestamp, 5 * 60 * 1000)) {
  return 403; // Request muy antigua o futura
}

if (!validateNonce(nonce)) {
  return 403; // Nonce ya usado (replay attack)
}
```
✅ **Efectivo contra**: Replay attacks

#### **Capa 4: HMAC Signatures (Integrity Check)**
```typescript
// Cliente firma la request
const signature = HMAC-SHA256(body + timestamp, secret);
headers['X-Signature'] = signature;

// Servidor verifica
if (!verifyRequestSignature(body, signature, secret)) {
  return 403; // Request modificada (tampering)
}
```
✅ **Efectivo contra**: Parameter tampering, request modification

#### **Capa 5: CSRF Protection**
```typescript
// Validar origen de la request
const origin = request.headers.get('origin');
const allowedOrigins = ['https://tu-app.com'];

if (!allowedOrigins.includes(origin)) {
  return 403; // Request desde dominio no autorizado
}
```
✅ **Efectivo contra**: CSRF, requests desde scripts externos

#### **Capa 6: Rate Limiting Agresivo**
```typescript
// Limitar por IP + User ID
if (!checkRateLimit(`${ip}_${userId}`, 20, 3600000)) {
  return 429; // Demasiadas requests
}
```
✅ **Efectivo contra**: Brute force, automated attacks

#### **Capa 7: Logging + Alertas**
```typescript
// Loguear toda actividad sospechosa
logSuspiciousActivity('tampering', {
  ip, userAgent, endpoint, params, error
});

// En producción: enviar a Sentry/LogRocket
if (process.env.NODE_ENV === 'production') {
  Sentry.captureMessage('Security Alert: Tampering', { level: 'warning' });
}
```
✅ **Efectivo para**: Detección, análisis forense

---

### **Ejemplo de Ataque Real y Defensa**

#### **Ataque: Modificar rating de 3.5 a 5.0**
```
1. Usuario hace review con rating 3.5
2. Atacante intercepta con Burp Suite
3. Modifica: "rating": 3.5 → "rating": 5.0
4. Envía request modificada
```

#### **Defensa Multi-Capa:**
```typescript
// ✅ Validación server-side
const validation = validateRating(rating);
if (!validation.valid) {
  // Rating 5.0 es válido, pasa ✓
}

// ✅ Verificar firma HMAC
const expectedSignature = HMAC(body, secret);
if (signature !== expectedSignature) {
  // ⚠️ Firma no coincide (body fue modificado)
  // BLOQUEADO ❌
  return 403;
}
```

**Resultado**: Ataque bloqueado por capa de integridad (HMAC).

---

### **Implementación Práctica**

#### **En el Cliente (Frontend)**
```typescript
// components/review-form.tsx
async function submitReview(data) {
  const timestamp = Date.now();
  const nonce = generateNonce();
  const signature = await generateSignature(data, timestamp);
  
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature,
    },
    body: JSON.stringify(data),
  });
}
```

#### **En el Servidor (Backend)**
```typescript
// api/reviews/route.ts
export async function POST(request: Request) {
  // 1. Validar headers de seguridad
  const validation = await validateSecureRequest(request, {
    requireNonce: true,
    requireSignature: true,
    requireTimestamp: true,
  });
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Security validation failed', details: validation.errors },
      { status: 403 }
    );
  }
  
  // 2. Validar parámetros
  const body = await request.json();
  const paramValidation = validateReviewParams(body);
  
  if (!paramValidation.valid) {
    logSuspiciousActivity('tampering', { /* ... */ });
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }
  
  // 3. Procesar request
  // ...
}
```

---

### **Configuración de Seguridad Recomendada**

| Nivel | Protección | Complejidad | Impacto Performance | Recomendado |
|-------|-----------|-------------|---------------------|-------------|
| Básico | Validación server-side | Baja | Ninguno | ✅ Siempre |
| Medio | Rate limiting | Media | Bajo | ✅ Siempre |
| Medio | CSRF validation | Media | Ninguno | ✅ Siempre |
| Alto | Timestamps + Nonces | Alta | Bajo | ✅ Endpoints críticos |
| Muy Alto | HMAC Signatures | Muy Alta | Medio | ⚠️ Solo endpoints ultra-sensibles |

**Recomendación para esta app:**
- ✅ Todos los endpoints: Validación + Rate Limiting + CSRF
- ✅ Endpoints críticos (create review, register): + Timestamps
- ⚠️ Opcional: HMAC signatures (si hay problemas de abuse)

---

## �🚀 Mejoras Recomendadas para Producción

### 1. **Rate Limiting con Redis**
```bash
npm install ioredis
```

Reemplazar `checkRateLimit()` in-memory por Redis:
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimitRedis(key: string, limit: number, window: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, Math.floor(window / 1000));
  }
  return current <= limit;
}
```

### 2. **CSRF Protection**
Implementar tokens CSRF para formularios:
```typescript
import { generateCsrfToken } from '@/lib/security';

// En el servidor
const csrfToken = generateCsrfToken();
// Enviar con la respuesta y validar en POST
```

### 3. **Content Security Policy con Nonces**
```typescript
// Generar nonce único por request
const nonce = crypto.randomBytes(16).toString('base64');
response.headers.set(
  'Content-Security-Policy',
  `script-src 'self' 'nonce-${nonce}'`
);
```

### 4. **Logging y Monitoring**
```bash
npm install winston
```

Implementar logs estructurados:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Loguear eventos de seguridad
logger.warn('Failed login attempt', { email, ip });
```

### 5. **2FA (Two-Factor Authentication)**
Considerar agregar 2FA para cuentas con muchos seguidores:
```bash
npm install otplib qrcode
```

### 6. **Backup y Recovery**
- Backups automáticos de la base de datos (diarios)
- Plan de disaster recovery
- Rotación de secrets (JWT_SECRET, etc.)

### 7. **Security Audits**
```bash
# Escanear dependencias vulnerables
npm audit

# Ejecutar análisis de seguridad
npx snyk test

# Actualizar dependencias
npm update --save
```

---

## �️ Protección contra Proxy/Tampering Attacks

### **Problema: Interceptar requests con Burp Suite, OWASP ZAP, o DevTools**

Cuando un atacante usa un proxy para interceptar requests, puede:
- ✅ Modificar parámetros (rating, IDs, etc.)
- ✅ Reusar requests (replay attacks)
- ✅ Eliminar validaciones del cliente
- ✅ Inyectar payloads maliciosos

### **Soluciones Implementadas:**

#### 1. **Validación Server-Side Estricta**
```typescript
// ❌ NUNCA confiar en validación del cliente
// ✅ SIEMPRE validar en el servidor

// Ejemplo: validateReviewParams()
- Valida que rating sea 1-5 y múltiplo de 0.5
- Valida longitud de texto (10-1000 chars)
- Valida formato de IDs (CUID de Prisma)
```

#### 2. **Detección de Tampering**
```typescript
// Si los parámetros están fuera de rango, se loguea:
logSuspiciousActivity('tampering', {
  ip: '192.168.1.1',
  endpoint: '/api/reviews',
  params: { rating: 10 }, // ⚠️ Fuera de rango!
});
```

#### 3. **Protección contra Replay Attacks**
```typescript
// Headers requeridos para requests críticas:
X-Timestamp: 1696262400000  // Expira en 5 minutos
X-Nonce: [token único]       // Solo se puede usar 1 vez
X-Signature: [HMAC-SHA256]   // Verifica integridad
```

#### 4. **CSRF Protection**
```typescript
// Middleware valida origen en POST/PUT/DELETE
- Verifica header Origin
- Verifica header Referer
- Solo permite requests del mismo dominio
```

#### 5. **Detección de Herramientas de Hacking**
```typescript
// Bloquea User-Agents sospechosos:
- Burp Suite
- OWASP ZAP
- sqlmap
- nikto
- nmap
```

---

## �🔍 Testing de Seguridad

### 1. **XSS Testing**
```javascript
// Test payload en reviews/comentarios
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<iframe src="javascript:alert('XSS')">

// ✅ Todos deben ser bloqueados/sanitizados
```

### 2. **SQL Injection Testing**
```javascript
// Test payload en búsquedas
' OR '1'='1
'; DROP TABLE users; --
1' UNION SELECT * FROM users--

// ✅ Prisma protege automáticamente
```

### 3. **IDOR Testing**
```javascript
// Intentar acceder a review de otro usuario
DELETE /api/reviews/[otro-usuario-review-id]
PUT /api/reviews/[otro-usuario-review-id]

// ✅ Debe devolver 403 Forbidden
```

### 4. **Rate Limiting Testing**
```bash
# Enviar múltiples requests rápidamente
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/reviews
done

# ✅ Después del límite, debe devolver 429
```

### 5. **Parameter Tampering Testing**
```bash
# Intentar modificar rating fuera de rango con Burp Suite
POST /api/reviews
{
  "rating": 10,        # ❌ Fuera de rango
  "rating": 3.7,       # ❌ No es múltiplo de 0.5
  "showId": "../../etc/passwd"  # ❌ Path traversal
}

# ✅ Debe devolver 400 con "Parámetros inválidos detectados"
# ✅ Debe loguear actividad sospechosa
```

### 6. **Replay Attack Testing**
```bash
# Capturar una request válida con Burp
# Esperar 6 minutos
# Reenviar la misma request

# ✅ Debe devolver error por timestamp expirado
# ✅ Debe detectar nonce reutilizado
```

### 7. **CSRF Testing**
```html
<!-- Página maliciosa externa intentando hacer POST -->
<form action="https://tu-app.com/api/reviews" method="POST">
  <input name="rating" value="5">
  <input name="showId" value="...">
</form>
<script>document.forms[0].submit();</script>

<!-- ✅ Debe ser bloqueada por validación de Origin/Referer -->
```

---

## 📚 Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NextAuth.js Security](https://next-auth.js.org/security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## 🐛 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor **NO la publiques públicamente**. Envía un email privado a: security@example.com

**Tiempo de respuesta**: 48 horas
**Tiempo de fix**: 7 días (crítico), 30 días (medio)

---

## ✅ Conclusión

Esta aplicación implementa **múltiples capas de seguridad** para proteger contra las vulnerabilidades más comunes:

1. ✅ **XSS**: DOMPurify sanitiza todo HTML
2. ✅ **SQL Injection**: Prisma + validación de IDs
3. ✅ **IDOR**: Verificación de ownership en todos los endpoints
4. ✅ **Rate Limiting**: Protección contra abuse
5. ✅ **Auth**: Contraseñas fuertes + bcrypt rounds aumentados
6. ✅ **Headers**: Security headers completos
7. ✅ **Input Validation**: Zod + sanitización múltiple

**Estado de producción**: ✅ Listo con mejoras recomendadas para escala.

---

## 🚀 Security for Deployment

### Variables de Entorno en Producción

**NUNCA commitear estos valores a Git:**

```env
# ✅ Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here

# ✅ Set in Vercel dashboard
DATABASE_URL=postgresql://...

# ✅ For cron scraper security
SCRAPER_API_KEY=your-scraper-key
```

### Checklist Pre-Deployment

- [ ] NEXTAUTH_SECRET generado y único
- [ ] DATABASE_URL usa contraseña fuerte (min 16 chars, mixed + numbers + symbols)
- [ ] NEXTAUTH_URL coincide con dominio real (sin typos)
- [ ] Todos los .env* en .gitignore
- [ ] No hay console.logs de datos sensibles
- [ ] Backup de BD configurado
- [ ] HTTPS habilitado (automático en Vercel)
- [ ] Rate limiting configurado

### Monitoreo en Producción

- **Intentos de auth fallidos**: Indicador de ataque de fuerza bruta
- **Rate limit violations**: Posible DDoS o scraping malicioso
- **Errores de BD**: Anomalías en acceso de datos
- **Tiempos de respuesta lentos**: Potencial DDoS

### Rotación de Secrets

**Cada 3 meses:**
1. Generar nuevo NEXTAUTH_SECRET
2. Actualizar en Vercel
3. Redeploy automático
4. Monitorear logs
5. Archivar secret antiguo

**En caso de compromiso:**
1. Rotar secretos inmediatamente
2. Revisar logs de acceso
3. Forzar logout de todas las sesiones
4. Auditar código
5. Notificar usuarios si es necesario

---

## ✅ Conclusión Final

Esta aplicación implementa **múltiples capas de seguridad**:

1. ✅ **XSS**: DOMPurify sanitiza todo HTML
2. ✅ **SQL Injection**: Prisma + validación de IDs
3. ✅ **IDOR**: Verificación de ownership
4. ✅ **Rate Limiting**: Protección contra abuse
5. ✅ **Auth**: Contraseñas fuertes + bcrypt
6. ✅ **Headers**: Security headers completos
7. ✅ **Input Validation**: Zod + sanitización
8. ✅ **Environment Variables**: No hardcoded secrets
9. ✅ **Cron Security**: SCRAPER_API_KEY protection

**Deployment**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa.

```
