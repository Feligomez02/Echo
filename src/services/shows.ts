import { prisma } from '@/lib/prisma';

/**
 * Obtiene los próximos shows desde la base de datos
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 * Esta función es segura para usar en API Routes
 */
export async function getUpcomingShows(limit = 100) {
  return prisma.show.findMany({
    where: {
      date: {
        gte: new Date(),
      },
      // Enforce whitelist: Only La Estación and La Fábrica
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          likes: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: limit,
  });
}

/**
 * Obtiene un show por ID
 */
export async function getShowById(id: string) {
  return prisma.show.findUnique({
    where: { id },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          likes: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });
}

/**
 * Busca shows por artista
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function searchShowsByArtist(artist: string) {
  return prisma.show.findMany({
    where: {
      artist: {
        contains: artist,
        // Note: mode: 'insensitive' not supported in SQLite
      },
      date: {
        gte: new Date(),
      },
      // Enforce whitelist: Only La Estación and La Fábrica
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          likes: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * Busca shows por nombre o artista
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function searchShows(query: string) {
  return prisma.show.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            // Note: mode: 'insensitive' not supported in SQLite
          },
        },
        {
          artist: {
            contains: query,
            // Note: mode: 'insensitive' not supported in SQLite
          },
        },
        {
          venue: {
            contains: query,
            // Note: mode: 'insensitive' not supported in SQLite
          },
        },
      ],
      date: {
        gte: new Date(),
      },
      // Enforce whitelist: Only La Estación and La Fábrica
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
    include: {
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          likes: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: 50,
  });
}

/**
 * Obtiene estadísticas del scraping
 * FILTERED: Only shows from whitelisted venues (La Estación & La Fábrica)
 */
export async function getScrapingStats() {
  // Count only from whitelisted sources
  const total = await prisma.show.count({
    where: {
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
  });
  
  const upcoming = await prisma.show.count({
    where: {
      date: {
        gte: new Date(),
      },
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
  });
  
  const past = total - upcoming;

  const sources = await prisma.show.groupBy({
    by: ['source'],
    where: {
      source: {
        in: ['laestacion', 'lafabrica'],
      },
    },
    _count: true,
  });

  return {
    total,
    upcoming,
    past,
    bySources: sources.map((s: { source: string; _count: number }) => ({
      source: s.source,
      count: s._count,
    })),
  };
}
