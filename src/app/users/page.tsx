'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Input, Button, Avatar, Spinner } from '@nextui-org/react';
import { FiSearch, FiUsers, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import NavBar from '@/components/navbar';

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const [following, setFollowing] = useState<{ [key: string]: boolean }>({});

  // Búsqueda en tiempo real
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=30`);
      const data = await response.json();
      setUsers(data.users || []);
      
      // Inicializar estados de follow
      const followStates: { [key: string]: boolean } = {};
      data.users.forEach((user: any) => {
        followStates[user.id] = user.following || false;
      });
      setFollowing(followStates);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    if (!session) return;

    setFollowingStates((prev) => ({ ...prev, [userId]: !currentlyFollowing }));

    try {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;

      const response = await fetch(`/api/users/${targetUser.username}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentlyFollowing ? 'unfollow' : 'follow',
        }),
      });

      if (!response.ok) {
        // Revertir cambio si hay error
        setFollowingStates((prev) => ({ ...prev, [userId]: currentlyFollowing }));
      } else {
        // Actualizar estado
        setFollowing((prev) => ({ ...prev, [userId]: !currentlyFollowing }));
      }
    } catch (error) {
      console.error('Error with follow action:', error);
      setFollowingStates((prev) => ({ ...prev, [userId]: currentlyFollowing }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-orange-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <NavBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-amber-900 via-orange-700 to-amber-900
            dark:from-amber-300 dark:via-orange-300 dark:to-amber-300 bg-clip-text text-transparent font-sans">
            👥 DESCUBRE USUARIOS
          </h1>
          <p className="text-lg md:text-xl text-amber-800 dark:text-amber-300 font-semibold">
            Encuentra y sigue a otros fans de shows en Córdoba
          </p>
        </div>

        {/* Buscador */}
        <div className="mb-12 max-w-2xl">
          <Input
            placeholder="Buscar por usuario o nombre..."
            startContent={<FiSearch className="text-gray-600 dark:text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
            classNames={{
              input: "text-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold",
              inputWrapper: "h-14 bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
            }}
          />
        </div>

        {/* Resultados */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && searchTerm.trim().length === 0 && (
          <div className="retro-card p-12 text-center">
            <FiUsers className="text-6xl text-amber-700 dark:text-amber-400 mx-auto mb-4" />
            <p className="text-xl text-amber-900 dark:text-amber-100 font-semibold">
              Empieza a buscar usuarios para seguir
            </p>
            <p className="text-amber-800 dark:text-amber-300 mt-2">
              Ingresa un nombre o usuario para comenzar
            </p>
          </div>
        )}

        {!loading && searchTerm.trim().length > 0 && users.length === 0 && (
          <div className="retro-card p-12 text-center">
            <p className="text-xl text-amber-900 dark:text-amber-100 font-semibold">
              No se encontraron usuarios
            </p>
            <p className="text-amber-800 dark:text-amber-300 mt-2">
              Intenta con otra búsqueda
            </p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user: any) => (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-slate-700
                  hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300
                  transform hover:-translate-y-1"
              >
                {/* Avatar y nombre */}
                <div className="text-center mb-4">
                  <Link href={`/perfil/${user.username}`}>
                    <Avatar
                      src={user.image || undefined}
                      name={user.name || user.username}
                      className="w-16 h-16 mx-auto mb-3 cursor-pointer hover:shadow-lg transition-shadow"
                    />
                  </Link>
                  <Link href={`/perfil/${user.username}`}>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                      {user.name || user.username}
                    </h3>
                  </Link>
                  <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
                    @{user.username}
                  </p>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 text-center line-clamp-2">
                    {user.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="border-t border-gray-200 dark:border-slate-700 py-3 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Seguidores:</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {user._count.followers}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Siguiendo:</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {user._count.following}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FiStar className="w-4 h-4" /> Reviews:
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {user._count.reviews}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    as={Link}
                    href={`/perfil/${user.username}`}
                    className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white font-semibold
                      hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                    size="sm"
                  >
                    Ver Perfil
                  </Button>
                  {session && user.id !== (session.user as any).id && (
                    <Button
                      onClick={() => handleFollow(user.id, following[user.id] || false)}
                      disabled={followingStates[user.id] !== undefined && followingStates[user.id] !== (following[user.id] || false)}
                      className={`flex-1 font-black transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        following[user.id] || followingStates[user.id]
                          ? 'bg-gray-600 dark:bg-slate-600 text-white hover:bg-gray-700 dark:hover:bg-slate-500'
                          : 'bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-600 dark:to-orange-600 text-white hover:from-amber-800 hover:to-orange-800 dark:hover:from-amber-700 dark:hover:to-orange-700 hover:shadow-lg'
                      }`}
                      size="sm"
                    >
                      {following[user.id] || followingStates[user.id] ? '✓ Siguiendo' : '+ Seguir'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
