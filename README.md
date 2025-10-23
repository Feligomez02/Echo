# 🎤 ECHO - Live Music Reviews & Discovery


A modern social platform for discovering and reviewing live concerts and shows at La Estación and La Fábrica in Córdoba, Argentina.

**Built with:** Next.js 16 • React 19 • TypeScript • Tailwind CSS  
**Target Audience:** 18-40 years old  
**Status:** ✅ Production Ready

---

## 🎯 Features

- ✅ **Real Event Data**: Live scraping from La Estación & La Fábrica venues
- ✅ **Concert Reviews**: Rate shows 1-5 stars with detailed text
- ✅ **Social Interactions**: Like and comment on reviews
- ✅ **User Discovery**: Search and follow other music enthusiasts
- ✅ **Personalized Feed**: Community reviews and recommendations
- ✅ **Public Profiles**: View user review history and activity
- ✅ **Secure Authentication**: Email/password with NextAuth
- ✅ **High Performance**: Optimized LCP, parallel data fetching, code splitting

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 + React 19 + TypeScript |
| **Styling** | Tailwind CSS + NextUI |
| **Database** | Prisma + PostgreSQL (production) / SQLite (development) |
| **Authentication** | NextAuth v5 |
| **Data Source** | Puppeteer web scraping |
| **Performance** | Dynamic imports, React.memo, Promise.all |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                   # 23 API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── reviews/           # Review management
│   │   ├── shows/             # Show data
│   │   ├── users/             # User profiles & follow
│   │   └── recommendations/   # Personalized feed
│   ├── auth/                  # Login and registration pages
│   ├── shows/                 # Show listing and details
│   ├── para-ti/               # Personalized recommendations
│   ├── perfil/[username]/     # Public user profiles
│   ├── users/                 # User discovery
│   ├── layout.tsx
│   └── page.tsx               # Homepage feed
├── components/
│   ├── navbar.tsx
│   ├── retro-show-card.tsx
│   ├── retro-review-card.tsx
│   └── providers.tsx
├── lib/
│   ├── auth.ts
│   ├── authorization.ts
│   ├── prisma.ts
│   ├── security.ts
│   └── request-validation.ts
└── services/
    ├── scraper-estacion.ts
    ├── scraper-fabrica.ts
    ├── recommendations.ts
    └── shows.ts

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

---

## 🎨 Design System

ECHO uses a modern gradient design with blue, purple, and red colors:

```css
Primary Gradient: from-blue-600 via-purple-600 to-red-600
Light Mode: from-blue-50 to-purple-50
Dark Mode: from-blue-900 via-purple-900 to-red-900
```

---

## 📊 Data Models

### User
- Unique username and email
- Secure password (hashed)
- Follow relationships
- Review history

### Show
- Concert/event details
- Date and time
- Associated venue
- Community reviews

### Review
- Rating (1.0 - 5.0 with 0.5 increments)
- User feedback text
- Like counter
- Comment thread

### Venue
- La Estación
- La Fábrica

---

## 🔧 Available Commands

```bash
npm run dev              # Development server
npm run build           # Production build
npm run start           # Start production server
npm run db:push         # Sync database schema
npm run lint            # Run ESLint
npm run scrape:all      # Run venue scrapers
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Shows
- `GET /api/shows?page=1` - Browse shows (paginated)
- `GET /api/shows/[id]` - Show details

### Reviews
- `GET /api/reviews?showId=xxx` - Reviews for a show
- `POST /api/reviews` - Create review
- `POST /api/reviews/[id]/like` - Like/unlike
- `POST /api/reviews/[id]/comments` - Add comment

### Users
- `GET /api/users/search?q=term` - Search users
- `GET /api/users/[username]` - User profile
- `POST /api/users/[username]/follow` - Follow/unfollow

### Recommendations
- `GET /api/recommendations` - Personalized feed

---

## ⚡ Performance

The application is optimized for speed:

- **Parallel API Calls**: `Promise.all()` for concurrent data fetching
- **Code Splitting**: Dynamic imports reduce initial bundle size
- **Memoization**: Components prevent unnecessary re-renders
- **Fast Render**: 386ms LCP with optimized data loading

---

## 🔐 Security

Security is built into every layer:
- Input validation and sanitization
- Rate limiting on API endpoints
- CSRF protection via NextAuth
- Secure password hashing
- Authorization checks on protected routes

For detailed security measures, see [SECURITY.md](./SECURITY.md)

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🎵 Built in Córdoba

ECHO was created for the vibrant music community of Córdoba, Argentina.

**Enjoy the shows!** 🎤
