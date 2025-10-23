'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Input, Button, Card, CardBody, Skeleton } from '@nextui-org/react';
import { FiSearch, FiCalendar, FiTrendingUp, FiMusic, FiMapPin } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/navbar';

// Lazy load heavy components
const RetroShowCard = dynamic(() => import('@/components/retro-show-card'), {
  loading: () => <Skeleton className="h-64 rounded-lg" />,
  ssr: true,
});

const RetroReviewCard = dynamic(() => import('@/components/retro-review-card'), {
  loading: () => <Skeleton className="h-48 rounded-lg" />,
  ssr: true,
});

export default function HomePage() {
  const [featuredShows, setFeaturedShows] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Hacer ambos fetches en paralelo para optimizar LCP
    Promise.all([
      fetch('/api/shows').then(res => res.json()),
      fetch('/api/reviews').then(res => res.json())
    ])
    .then(([showsData, reviewsData]) => {
      // Procesar shows
      const sorted = showsData.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setFeaturedShows(sorted.slice(0, 6));
      setStats({ total: showsData.length, upcoming: sorted.length });
      
      // Procesar reviews
      setRecentReviews(reviewsData.slice(0, 6));
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shows?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const getRelativeTime = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(today.getMonth() + 1);

    return { today, thisWeek, thisMonth };
  };

  const { today, thisWeek, thisMonth } = getRelativeTime();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-16 md:py-24 border-b border-blue-200 dark:border-slate-700">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            {/* Decorative vinyl record - with hover effect */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-blue-600 dark:border-blue-400 
                bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-800 shadow-lg relative
                hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer" 
                title="Vinyl record">
                <div className="absolute inset-2 rounded-full border-2 border-purple-600 dark:border-purple-400"></div>
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600 to-purple-700 dark:from-red-500 dark:to-purple-600"></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600
              dark:from-blue-400 dark:via-purple-400 dark:to-red-400 bg-clip-text text-transparent
              font-sans tracking-tight">
              ECHO
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-600 dark:text-blue-300
              font-sans">
              Escucha las voces de la comunidad 🎤
            </h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto 
              leading-relaxed font-semibold">
              Reviews, comentarios y experiencias de shows en Córdoba
            </p>
            
            {/* Barra de búsqueda */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <Input
                size="lg"
                placeholder="Buscar shows o artistas"
                startContent={<FiSearch className="text-gray-600 dark:text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                classNames={{
                  input: "text-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white",
                  inputWrapper: "h-14 bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-700"
                }}
                endContent={
                  <Button 
                    type="submit"
                    className="font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md"
                  >
                    Buscar
                  </Button>
                }
              />
            </form>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                as={Link}
                href="/shows?date=today"
                variant="flat"
                startContent={<FiCalendar />}
                className="bg-blue-600 dark:bg-blue-700 text-white font-black hover:bg-blue-700 dark:hover:bg-blue-800 
                  hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Hoy
              </Button>
              <Button
                as={Link}
                href="/shows?date=week"
                variant="flat"
                startContent={<FiCalendar />}
                className="bg-purple-600 dark:bg-purple-700 text-white font-black hover:bg-purple-700 dark:hover:bg-purple-800
                  hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Esta Semana
              </Button>
              <Button
                as={Link}
                href="/shows?date=month"
                variant="flat"
                startContent={<FiCalendar />}
                className="bg-red-600 dark:bg-red-700 text-white font-black hover:bg-red-700 dark:hover:bg-red-800
                  hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Este Mes
              </Button>
              <Button
                as={Link}
                href="/shows"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 hover:from-blue-700 hover:via-purple-700 hover:to-red-700
                  dark:from-blue-500 dark:via-purple-500 dark:to-red-500 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-red-600
                  text-white font-black shadow-md hover:shadow-lg transition-all duration-200 
                  transform hover:scale-105 active:scale-95"
              >
                Ver Todos
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 
              rounded-lg p-6 shadow-md border border-gray-200 dark:border-slate-700
              hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300
              transform hover:-translate-y-1">
              <div className="text-center">
                <FiMusic className="text-4xl text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <p className="text-5xl font-black text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-gray-600 dark:text-gray-400 font-bold text-lg mt-1">Shows Disponibles</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 
              rounded-lg p-6 shadow-md border border-gray-200 dark:border-slate-700
              hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300
              transform hover:-translate-y-1">
              <div className="text-center">
                <FiTrendingUp className="text-4xl text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <p className="text-5xl font-black text-gray-900 dark:text-white">{stats.upcoming}</p>
                <p className="text-gray-600 dark:text-gray-400 font-bold text-lg mt-1">Eventos Próximos</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-slate-900 
              rounded-lg p-6 shadow-md border border-gray-200 dark:border-slate-700
              hover:shadow-xl hover:border-red-300 dark:hover:border-red-600 transition-all duration-300
              transform hover:-translate-y-1">
              <div className="text-center">
                <FiMapPin className="text-4xl text-red-600 dark:text-red-400 mx-auto mb-3" />
                <p className="text-5xl font-black text-gray-900 dark:text-white">2</p>
                <p className="text-gray-600 dark:text-gray-400 font-bold text-lg mt-1">Venues en Córdoba</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Shows */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white font-sans">
                🎫 PRÓXIMOS SHOWS
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                Los eventos más cercanos en Córdoba
              </p>
            </div>
            <Button
              as={Link}
              href="/shows"
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                text-white font-bold px-6 py-2 shadow-md"
            >
              Ver todos →
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardBody className="space-y-3">
                    <Skeleton className="h-40 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : featuredShows.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <FiMusic className="text-6xl text-default-300 mx-auto mb-4" />
                <p className="text-default-500 text-lg">No hay shows disponibles en este momento</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredShows.map((show: any) => (
                <RetroShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="mb-4 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white font-sans">
                💬 LO QUE DICE LA GENTE
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                Reviews honestas de shows reales desde la comunidad
              </p>
            </div>
            {!loading && recentReviews.length > 0 && (
              <Button
                as={Link}
                href="/shows"
                className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 
                  text-white font-bold px-6 py-2 shadow-md"
              >
                Ver todas →
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardBody className="space-y-3">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : recentReviews.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-default-500 text-lg mb-4">
                  No hay reviews todavía. ¡Sé el primero en compartir tu opinión!
                </p>
                <Button
                  as={Link}
                  href="/shows"
                  color="primary"
                  size="lg"
                >
                  Explorar Shows
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {recentReviews.map((review: any) => (
                <RetroReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 
        dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 border-t border-blue-800 dark:border-slate-700">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="mb-8 text-6xl md:text-7xl animate-pulse" style={{ animationDuration: '2s' }}>
            🎸
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white dark:text-white font-sans">
            ¿LISTO PARA TU PRÓXIMO SHOW?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 dark:text-gray-200 mb-10 leading-relaxed font-semibold">
            Unite a nuestra comunidad y no te pierdas ningún evento en Córdoba
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              as={Link}
              href="/shows"
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-red-400 hover:from-yellow-500 hover:to-red-500 
                dark:from-yellow-500 dark:to-red-500 dark:hover:from-yellow-600 dark:hover:to-red-600
                text-gray-900 font-black shadow-lg hover:shadow-xl transition-all duration-200
                transform hover:scale-105 active:scale-95"
            >
              🎫 Explorar Shows
            </Button>
            <Button
              as={Link}
              href="/auth/register"
              size="lg"
              className="border-2 border-blue-200 dark:border-blue-400 text-blue-100 dark:text-blue-200 
                hover:bg-blue-700/50 dark:hover:bg-blue-800/50 font-black transition-all duration-200
                transform hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              + Crear Cuenta Gratis
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
