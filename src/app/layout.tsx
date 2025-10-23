import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ECHO - Reviews de Shows en Vivo',
  description: 'Escucha las voces de la comunidad. Reviews, likes y comentarios sobre shows en Córdoba',
  keywords: 'shows, conciertos, reviews, Córdoba, música en vivo',
  openGraph: {
    title: 'ECHO - Reviews de Shows',
    description: 'Escucha las voces de la comunidad',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
