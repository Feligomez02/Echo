'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import {
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Chip,
  Divider,
} from '@nextui-org/react';
import NavBar from '@/components/navbar';
import RetroReviewCard from '@/components/retro-review-card';
import RetroShowCard from '@/components/retro-show-card';
import { FiUsers, FiStar, FiEdit } from 'react-icons/fi';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = (session?.user as any)?.username === username;

  useEffect(() => {
    if (!username) return;

    fetch(`/api/users/${username}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading profile:', error);
        setLoading(false);
      });
  }, [username]);

  const handleFollow = async () => {
    if (!session || followLoading) return;

    setFollowLoading(true);
    try {
      const isFollowing = profile.friendshipStatus?.isFollowing;
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isFollowing ? 'unfollow' : 'follow',
        }),
      });

      if (response.ok) {
        // Recargar perfil
        const updatedProfile = await fetch(`/api/users/${username}`).then((r) =>
          r.json()
        );
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error with follow action:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-orange-50 
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <NavBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-amber-900 dark:text-amber-100">
            👤 Usuario no encontrado
          </h1>
          <Button
            as="a"
            href="/"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-orange-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <NavBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header del perfil */}
        <div className="retro-card mb-8 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar
              src={profile.image || undefined}
              name={profile.name || profile.username}
              className="w-28 h-28 md:w-32 md:h-32"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-black text-amber-900 dark:text-amber-100 font-sans">
                  {profile.name || profile.username}
                </h1>
                {profile.friendshipStatus?.isMutual && (
                  <Chip color="success" size="sm" variant="flat">
                    👥 Amigos
                  </Chip>
                )}
              </div>
              <p className="text-lg md:text-xl text-amber-700 dark:text-amber-300 font-semibold mb-3">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-amber-800 dark:text-amber-200 mb-4 font-semibold text-lg">
                  {profile.bio}
                </p>
              )}
              <div className="border-t-2 border-dashed border-amber-400 dark:border-amber-600 pt-4 flex flex-wrap gap-6 text-base">
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <FiUsers className="w-5 h-5" />
                  <span>
                    <strong className="text-lg">{profile._count.followers}</strong> seguidores
                  </span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <FiUsers className="w-5 h-5" />
                  <span>
                    <strong className="text-lg">{profile._count.following}</strong> siguiendo
                  </span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                  <FiStar className="w-5 h-5" />
                  <span>
                    <strong className="text-lg">{profile._count.reviews}</strong> reviews
                  </span>
                </div>
              </div>
            </div>
            <div>
              {!isOwnProfile && session && (
                <Button
                  className={profile.friendshipStatus?.isFollowing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white font-bold'
                    : 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                  }
                  onClick={handleFollow}
                  isLoading={followLoading}
                >
                  {profile.friendshipStatus?.isFollowing
                    ? '✓ Siguiendo'
                    : '+ Seguir'}
                </Button>
              )}
              {isOwnProfile && (
                <Button
                  disabled
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold opacity-50 cursor-not-allowed"
                  startContent={<FiEdit />}
                  title="Edición de perfil próximamente"
                >
                  Editar Perfil (Próx.)
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Favoritos */}
        {profile.favorites && profile.favorites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-amber-900 dark:text-amber-100 font-sans flex items-center gap-2">
              ⭐ SHOWS FAVORITOS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {profile.favorites.map((fav: any) => (
                <RetroShowCard key={fav.show.id} show={fav.show} />
              ))}
            </div>
          </div>
        )}

        <div className="my-8 border-t-4 border-amber-800 dark:border-amber-600"></div>

        {/* Reviews */}
        <div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-amber-900 dark:text-amber-100 font-sans">
            💬 REVIEWS ({profile.reviews?.length || 0})
          </h2>
          {profile.reviews && profile.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {profile.reviews.map((review: any) => (
                <RetroReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="retro-card p-8 text-center">
              <p className="text-amber-900 dark:text-amber-100 font-sans text-lg">
                {isOwnProfile
                  ? '📝 Todavía no has publicado ninguna review'
                  : '📝 Este usuario no ha publicado reviews todavía'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
