'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button } from '@nextui-org/react';
import Link from 'next/link';
import { FiMail, FiLock, FiMusic } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email o contraseña incorrectos');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-amber-50 to-orange-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="retro-card p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl mb-4 inline-block">
              🎵
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-amber-900 dark:text-amber-100 font-sans mb-2">
              CÓRDOBA SHOWS
            </h1>
            <p className="text-lg text-amber-800 dark:text-amber-300 font-semibold">
              Inicia sesión en tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-amber-900 dark:text-amber-100 font-sans font-black mb-2 text-sm">
                📧 EMAIL
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 
                  text-amber-900 dark:text-amber-100 font-semibold placeholder-amber-600 dark:placeholder-amber-400 
                  focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-600
                  rounded transition-all"
              />
            </div>

            <div>
              <label className="block text-amber-900 dark:text-amber-100 font-sans font-black mb-2 text-sm">
                🔐 CONTRASEÑA
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 
                  text-amber-900 dark:text-amber-100 font-semibold placeholder-amber-600 dark:placeholder-amber-400 
                  focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-600
                  rounded transition-all"
              />
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800 font-semibold">
                ⚠️ {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800
                dark:from-amber-600 dark:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700
                text-white font-black py-3 rounded mt-2 transition-all shadow-md hover:shadow-lg
                transform hover:scale-105 active:scale-95"
            >
              {loading ? '⏳ Iniciando sesión...' : '✓ Iniciar Sesión'}
            </Button>
          </form>

          <div className="border-t-2 border-dashed border-amber-400 dark:border-amber-600 my-6"></div>

          <div className="text-center text-sm">
            <p className="text-amber-900 dark:text-amber-100 font-semibold">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-amber-600 dark:text-amber-400 font-black hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
