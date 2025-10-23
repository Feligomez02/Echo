'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Input, Button } from '@nextui-org/react';
import Link from 'next/link';
import { FiMail, FiLock, FiUser, FiMusic } from 'react-icons/fi';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear cuenta');
        return;
      }

      // Registro exitoso, redirigir a login
      router.push('/auth/login?registered=true');
    } catch (error) {
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-purple-50 
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="retro-card p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl mb-4 inline-block">
              �
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-blue-900 dark:text-blue-100 font-sans mb-2">
              ECHO
            </h1>
            <p className="text-lg text-blue-800 dark:text-blue-300 font-semibold">
              Crea tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-blue-900 dark:text-blue-100 font-sans font-black mb-2 text-sm">
                📧 EMAIL
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 
                  text-blue-900 dark:text-blue-100 font-semibold placeholder-blue-600 dark:placeholder-blue-400 
                  focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600
                  rounded transition-all"
              />
            </div>

            <div>
              <label className="block text-blue-900 dark:text-blue-100 font-sans font-black mb-2 text-sm">
                👤 USUARIO
              </label>
              <input
                type="text"
                placeholder="usuario123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                minLength={3}
                maxLength={20}
                required
                className="w-full px-4 py-3 border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 
                  text-blue-900 dark:text-blue-100 font-semibold placeholder-blue-600 dark:placeholder-blue-400 
                  focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600
                  rounded transition-all"
              />
            </div>

            <div>
              <label className="block text-blue-900 dark:text-blue-100 font-sans font-black mb-2 text-sm">
                🎤 NOMBRE (OPCIONAL)
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 
                  text-blue-900 dark:text-blue-100 font-semibold placeholder-blue-600 dark:placeholder-blue-400 
                  focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600
                  rounded transition-all"
              />
            </div>

            <div>
              <label className="block text-blue-900 dark:text-blue-100 font-sans font-black mb-2 text-sm">
                🔐 CONTRASEÑA
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
                className="w-full px-4 py-3 border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 
                  text-blue-900 dark:text-blue-100 font-semibold placeholder-blue-600 dark:placeholder-blue-400 
                  focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600
                text-white font-black py-3 rounded mt-2 transition-all shadow-md hover:shadow-lg
                transform hover:scale-105 active:scale-95"
            >
              {loading ? '⏳ Creando cuenta...' : '✓ Crear Cuenta'}
            </Button>
          </form>

          <div className="border-t-2 border-dashed border-blue-400 dark:border-blue-600 my-6"></div>

          <div className="text-center text-sm">
            <p className="text-blue-900 dark:text-blue-100 font-semibold">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-black hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
