'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner, Button, Card, CardBody, Chip } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/navbar';
import RetroShowCard from '@/components/retro-show-card';
import { FiStar, FiLock } from 'react-icons/fi';

export default function ParaTiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/recommendations')
        .then((res) => res.json())
        .then((data) => {
          setRecommendations(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error loading recommendations:', error);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-orange-50 
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <NavBar />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-orange-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <NavBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-amber-900 via-orange-700 to-amber-900
            dark:from-amber-300 dark:via-orange-300 dark:to-amber-300 bg-clip-text text-transparent font-sans">
            ⭐ PARA TI
          </h1>
          <p className="text-lg md:text-xl text-amber-800 dark:text-amber-300 font-semibold">
            Shows recomendados según tus gustos y amigos en Córdoba
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="retro-card p-8 text-center">
            <p className="text-amber-900 dark:text-amber-100 font-semibold text-xl mb-4">
              📭 No hay recomendaciones disponibles todavía
            </p>
            <p className="text-base text-amber-800 dark:text-amber-300 mb-6">
              Agrega shows a tus favoritos y sigue a otros usuarios para recibir recomendaciones personalizadas
            </p>
            <Button
              as="a"
              href="/shows"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              🎫 Explorar Shows
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="inline-block retro-card px-6 py-3 border border-amber-300 dark:border-amber-600">
                <span className="text-amber-900 dark:text-amber-100 font-black text-lg">
                  🎵 {recommendations.length} recomendaciones encontradas
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {recommendations.map((rec: any) => (
                <RetroShowCard
                  key={rec.id}
                  show={rec}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
