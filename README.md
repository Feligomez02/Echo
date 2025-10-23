# 🎤 ECHO - Live Music Reviews & Discovery# 🎸 Córdoba Shows - MVP de Reviews de Conciertos



ECHO is a modern social platform for discovering and reviewing live concerts and shows at **La Estación** and **La Fábrica** in Córdoba, Argentina. Rate performances, connect with music fans, and explore what's happening in the local music scene.App web tipo red social para revisar y descubrir shows y conciertos en Córdoba, Argentina.



**Built with:** Next.js 16 • React 19 • TypeScript • Tailwind CSS  > **⚡ Quick Start:** Si querés empezar rápido, ve a [QUICKSTART.md](./QUICKSTART.md)

**Target Audience:** 18-40 years old  

**Status:** ✅ Production Ready## 📚 Documentación



---| Guía | Descripción |

|------|-------------|

## 🎯 Features| [**QUICKSTART.md**](./QUICKSTART.md) | Instalación en 3 pasos |

| [**INSTALL.md**](./INSTALL.md) | Guía detallada de instalación |

- ✅ **Real Events**: Live scraping from La Estación & La Fábrica venues| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Deploy en Vercel paso a paso |

- ✅ **Reviews & Ratings**: Rate shows 1-5 stars (0.5 increments)| [**API.md**](./API.md) | Documentación de endpoints |

- ✅ **Review Interactions**: Like, comment, and discuss performances| [**SCRAPING.md**](./SCRAPING.md) | 🎵 Scraping de shows desde Passline |

- ✅ **User Discovery**: Search and follow music enthusiasts| [**SECURITY.md**](./SECURITY.md) | 🔒 Medidas de seguridad implementadas |

- ✅ **Personalized Feed**: See reviews from the community| [**PROXY-ATTACKS.md**](./PROXY-ATTACKS.md) | 🛡️ Protección contra interceptación de requests |

- ✅ **Profile Pages**: Public profiles with user history| [**ROADMAP.md**](./ROADMAP.md) | Features futuras y mejoras |

- ✅ **Dark/Light Mode**: Full theme support| [**NEXT_STEPS.md**](./NEXT_STEPS.md) | Qué hacer después del MVP |

- ✅ **Authentication**: Secure email/password with NextAuth| [**SUMMARY.md**](./SUMMARY.md) | Resumen ejecutivo del proyecto |

- ✅ **Performance Optimized**: 10.8s LCP, parallel data fetching, code splitting

## 🎯 Características

---

- ✅ **Autenticación**: Email/password con NextAuth

## 🚀 Quick Start- ✅ **Reviews**: Ratings de 1-5 estrellas (con medias: 1.5, 2.5, etc.)

- ✅ **Sistema de Amigos**: Follow/unfollow con amigos mutuos

### Prerequisites- ✅ **Likes/Dislikes**: Reacciones a reviews

- Node.js 18+ installed- ✅ **Comentarios**: Solo entre amigos mutuos

- npm or yarn- ✅ **Favoritos**: Hasta 5 shows/artistas por usuario

- ✅ **"Para Ti"**: Recomendaciones personalizadas basadas en gustos y amigos

### Installation- ✅ **Feed Social**: Ver reviews recientes de la comunidad

- ✅ **Shows en Córdoba**: Calendario de eventos próximos

```bash- 🔒 **Seguridad**: Protección contra XSS, SQL Injection, IDOR, Rate Limiting

# 1. Install dependencies

npm install> 📖 **Ver todas las medidas de seguridad en [SECURITY.md](./SECURITY.md)**



# 2. Setup database## 🚀 Tech Stack

npm run db:push

- **Framework**: Next.js 14 (App Router) + TypeScript

# 3. Seed sample data (optional)- **UI**: NextUI + Tailwind CSS

npm run db:seed- **Base de Datos**: Prisma + SQLite (dev) / PostgreSQL (prod)

- **Autenticación**: NextAuth v4 con JWT

# 4. Start development server- **Seguridad**: DOMPurify, Rate Limiting, Security Headers

npm run dev- **Validación**: Zod + sanitización de inputs

```- **Icons**: React Icons (Feather)



Visit `http://localhost:3000` 🎵## 📦 Instalación



---### Prerrequisitos



## 📦 Tech Stack- Node.js 18+ instalado

- npm o yarn

| Category | Technology |

|----------|------------|### Pasos

| **Framework** | Next.js 16 (App Router) + React 19 |

| **Language** | TypeScript |1. **Instalar dependencias**:

| **Styling** | Tailwind CSS + NextUI |

| **Database** | Prisma + SQLite (dev) / PostgreSQL (prod) |```bash

| **Auth** | NextAuth v5 |npm install

| **Real Data** | Puppeteer scraping (La Estación, La Fábrica) |```

| **Performance** | Dynamic imports, React.memo, Promise.all |

2. **Configurar variables de entorno**:

---

El archivo `.env` ya está creado con valores por defecto. Si necesitas cambiarlos:

## 📁 Project Structure

```env

```DATABASE_URL="file:./dev.db"

├── prisma/NEXTAUTH_SECRET="cordoba-shows-secret-key-change-in-production-2025"

│   ├── schema.prisma              # Database modelsNEXTAUTH_URL="http://localhost:3000"

│   ├── seed.ts                    # Sample data```

│   └── migrations/                # Database migrations

├── src/3. **Inicializar la base de datos**:

│   ├── app/

│   │   ├── api/                   # 23 API routes```bash

│   │   │   ├── auth/              # Authenticationnpm run db:push

│   │   │   ├── reviews/           # Review CRUD, likes, comments```

│   │   │   ├── shows/             # Shows & details

│   │   │   ├── users/             # Profile & follow4. **Cargar datos de prueba** (opcional pero recomendado):

│   │   │   └── recommendations/   # Personalized feed

│   │   ├── auth/                  # Login/Register pages```bash

│   │   ├── shows/                 # Shows listing & detailsnpm run db:seed

│   │   ├── para-ti/               # Personalized recommendations```

│   │   ├── perfil/[username]/     # User profiles

│   │   ├── users/                 # User discoveryEsto creará:

│   │   ├── layout.tsx             # Main layout- 3 usuarios de prueba (juan@example.com, maria@example.com, carlos@example.com)

│   │   └── page.tsx               # Homepage feed- 8 shows en Córdoba con diferentes fechas

│   ├── components/- Reviews, amistades y comentarios de ejemplo

│   │   ├── navbar.tsx             # Navigation- Contraseña para todos los usuarios: `password123`

│   │   ├── retro-show-card.tsx    # Show card (memoized)

│   │   ├── retro-review-card.tsx  # Review card (memoized)5. **Iniciar servidor de desarrollo**:

│   │   └── providers.tsx          # App providers

│   ├── lib/```bash

│   │   ├── auth.ts                # NextAuth confignpm run dev

│   │   ├── authorization.ts       # Permission checks```

│   │   ├── prisma.ts              # Prisma client

│   │   ├── security.ts            # Security utilities6. **Abrir en el navegador**:

│   │   └── request-validation.ts  # Input validation

│   ├── services/```

│   │   ├── scraper-estacion.ts    # La Estación scraperhttp://localhost:3000

│   │   ├── scraper-fabrica.ts     # La Fábrica scraper```

│   │   ├── recommendations.ts     # Recommendation algorithm

│   │   └── shows.ts               # Show service## 🧪 Usuarios de Prueba

│   └── scripts/

│       ├── scrape-all.ts          # Run all scrapersDespués de correr el seed, puedes usar estas cuentas:

│       └── clean-venues.ts        # Venue deduplication

└── package.json| Email | Username | Password |

```|-------|----------|----------|

| juan@example.com | juan_cba | password123 |

---| maria@example.com | maria_music | password123 |

| carlos@example.com | carlos_cba | password123 |

## 🎨 Brand Identity

## 📁 Estructura del Proyecto

ECHO features a modern gradient design: **Blue → Purple → Red**

```

```css├── prisma/

/* Primary gradient */│   ├── schema.prisma          # Modelos de la BD

from-blue-600 via-purple-600 to-red-600│   └── seed.ts                # Datos de prueba

├── src/

/* Light backgrounds */│   ├── app/

from-blue-50 to-purple-50│   │   ├── api/               # API Routes

│   │   │   ├── auth/          # Registro y NextAuth

/* Dark mode */│   │   │   ├── reviews/       # CRUD reviews, likes, comments

from-blue-900 via-purple-900 to-red-900│   │   │   ├── shows/         # Shows y detalles

```│   │   │   ├── users/         # Perfiles y follow

│   │   │   └── recommendations/ # Recomendaciones

---│   │   ├── auth/

│   │   │   ├── login/         # Página login

## 📊 Database Models│   │   │   └── register/      # Página registro

│   │   ├── shows/             # Listado de shows

### User│   │   ├── para-ti/           # Recomendaciones personalizadas

- Email, username, password, bio│   │   ├── perfil/[username]/ # Perfil de usuario

- Follow relationships│   │   ├── layout.tsx         # Layout principal

- Reviews and interactions│   │   └── page.tsx           # Feed de reviews

│   ├── components/

### Show│   │   ├── navbar.tsx         # Navegación

- Title, artist, date, time│   │   ├── rating-stars.tsx   # Componente de estrellas

- Venue (La Estación or La Fábrica)│   │   ├── review-card.tsx    # Card de review

- Source identifier│   │   ├── show-card.tsx      # Card de show

│   │   └── providers.tsx      # NextUI + Auth providers

### Review│   ├── lib/

- Rating (1.0 - 5.0)│   │   ├── auth.ts            # Configuración NextAuth

- Text content│   │   └── prisma.ts          # Cliente Prisma

- Likes counter│   └── services/

- Comments│       ├── scraper.ts         # Servicio de scraping (mock)

│       └── recommendations.ts # Algoritmo de recomendaciones

### Venue└── package.json

- La Estación```

- La Fábrica

## 🎨 Modelos de Datos

---

### User

## 🔧 Available Scripts- Email, username, password, bio

- Favoritos (máx 5 shows)

```bash- Reviews, comments, likes

npm run dev              # Development server (10-12s compile time)

npm run build           # Production build### Show

npm run start           # Production server- Nombre, artista, fecha, venue

npm run db:push         # Sync database schema- Ciudad (siempre Córdoba)

npm run db:seed         # Load sample data- Reviews asociadas

npm run lint            # Run ESLint

npm run scrape:all      # Run all venue scrapers### Review

```- Rating (1.0 - 5.0, incrementos de 0.5)

- Texto (min 10 chars)

---- Likes/dislikes

- Comentarios

## 🌐 API Endpoints

### Friendship

### Authentication- Sistema de follow bidireccional

- `POST /api/auth/register` - Create account- Status: pending/accepted

- `POST /api/auth/[...nextauth]` - NextAuth routes

## 🔧 Scripts Disponibles

### Shows

- `GET /api/shows?page=1` - List shows (paginated)```bash

- `GET /api/shows/[id]` - Show detailsnpm run dev          # Desarrollo

npm run build        # Build producción

### Reviewsnpm run start        # Servidor producción

- `GET /api/reviews?showId=xxx` - List reviews for shownpm run db:push      # Sincronizar BD

- `POST /api/reviews` - Create reviewnpm run db:seed      # Cargar datos de prueba

- `POST /api/reviews/[id]/like` - Like/unlikenpm run lint         # Linter

- `POST /api/reviews/[id]/comments` - Add comment```



### Users## 🚢 Deploy en Vercel

- `GET /api/users/search?q=term` - Search users

- `GET /api/users/[username]` - User profile### Opción 1: Deploy automático desde GitHub

- `POST /api/users/[username]/follow` - Follow/unfollow

1. Sube el proyecto a GitHub

### Recommendations2. Ve a [Vercel](https://vercel.com)

- `GET /api/recommendations` - Personalized feed3. Click en "New Project"

4. Importa tu repositorio

---5. Configura las variables de entorno:

   - `DATABASE_URL`

## 🚢 Deployment   - `NEXTAUTH_SECRET` (genera uno nuevo)

   - `NEXTAUTH_URL` (tu URL de Vercel)

### Deploy to Vercel6. Deploy



```bash### Opción 2: Deploy desde CLI

npm i -g vercel

vercel login```bash

vercelnpm i -g vercel

```vercel login

vercel

**Environment Variables:**```

```env

DATABASE_URL=postgresql://...### ⚠️ Importante para Producción

NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

NEXTAUTH_URL=https://your-domain.com1. **Base de Datos**: SQLite NO es recomendado para producción en Vercel. Considera:

```   - **Vercel Postgres** (recomendado)

   - **PlanetScale**

**Important:** Use PostgreSQL in production, not SQLite.   - **Neon**

   - **Supabase**

---

2. **Cambiar a PostgreSQL**: Edita `prisma/schema.prisma`:

## 📈 Performance Optimizations   ```prisma

   datasource db {

- ✅ **Parallel Data Fetching**: `Promise.all()` for concurrent API calls     provider = "postgresql"  // cambiar de sqlite a postgresql

- ✅ **Code Splitting**: Dynamic imports for show/review cards     url      = env("DATABASE_URL")

- ✅ **Component Memoization**: `React.memo()` on high-traffic components   }

- ✅ **LCP Optimized**: 10.8s homepage load time   ```



---3. **Variables de entorno en Vercel**:

   - Agrega `NEXTAUTH_SECRET` único (puedes generarlo con `openssl rand -base64 32`)

## 🤝 Contributing   - Actualiza `NEXTAUTH_URL` a tu dominio de Vercel



1. Fork the project4. **Migrar datos**: Si tienes datos en SQLite local:

2. Create a feature branch: `git checkout -b feature/amazing-feature`   ```bash

3. Commit: `git commit -m 'Add amazing feature'`   npx prisma migrate dev

4. Push: `git push origin feature/amazing-feature`   npx prisma db push

5. Open a Pull Request   ```



---## 🧩 Próximas Mejoras



## 📄 License- [ ] Implementar scraping real de Passline/Ticketek

- [ ] Agregar imágenes a los shows

MIT License - See LICENSE file for details- [ ] Sistema de notificaciones

- [ ] Búsqueda avanzada de shows y usuarios

---- [ ] Filtros por género musical

- [ ] Calendario personal de shows

## 🎵 Made in Córdoba- [ ] Compartir reviews en redes sociales

- [ ] Dark/Light mode persistente

Built for the music community of Córdoba, Argentina.  - [ ] PWA (Progressive Web App)

**Enjoy the shows!** 🎤🎸

## 📝 API Endpoints

---

### Autenticación

**Questions?** Check [SECURITY.md](./SECURITY.md) for security details.- `POST /api/auth/register` - Crear cuenta

- `POST /api/auth/[...nextauth]` - NextAuth (login, logout, session)

### Reviews
- `GET /api/reviews` - Listar reviews (query: ?showId=xxx o ?userId=xxx)
- `POST /api/reviews` - Crear review
- `POST /api/reviews/[id]/like` - Like/dislike
- `POST /api/reviews/[id]/comments` - Comentar (solo amigos)

### Shows
- `GET /api/shows` - Listar shows próximos
- `GET /api/shows/[id]` - Detalles de show

### Usuarios
- `GET /api/users/[username]` - Perfil público
- `POST /api/users/[username]/follow` - Seguir/dejar de seguir

### Recomendaciones
- `GET /api/recommendations` - Shows recomendados (requiere auth)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver LICENSE para más detalles

## 🎵 Hecho en Córdoba

Este proyecto fue creado para la comunidad musical de Córdoba, Argentina. ¡Disfrutá de los shows! 🎸🎤
