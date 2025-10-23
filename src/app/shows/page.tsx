'use client';

import { useEffect, useState, Suspense } from 'react';
import { Spinner, Input, Button, Pagination } from '@nextui-org/react';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/navbar';
import RetroShowCard from '@/components/retro-show-card';

const SHOWS_PER_PAGE = 12;

function ShowsPageContent() {
  const searchParams = useSearchParams();
  const [shows, setShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar shows y aplicar filtros de URL
  useEffect(() => {
    fetch('/api/shows')
      .then((res) => res.json())
      .then((data) => {
        // Ordenar por fecha (más cercanos primero)
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        setShows(sortedData);
        setFilteredShows(sortedData);
        
        // Aplicar filtros de URL
        const urlDateFilter = searchParams.get('date');
        const urlSearch = searchParams.get('search');
        
        if (urlDateFilter) {
          setDateFilter(urlDateFilter);
        }
        if (urlSearch) {
          setSearchTerm(urlSearch);
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading shows:', error);
        setLoading(false);
      });
  }, [searchParams]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...shows];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((show: any) =>
        show.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de venue
    if (venueFilter) {
      filtered = filtered.filter((show: any) =>
        show.venue.toLowerCase().includes(venueFilter.toLowerCase())
      );
    }

    // Filtro de fuente
    if (sourceFilter) {
      filtered = filtered.filter((show: any) => show.source === sourceFilter);
    }

    // Filtro de fecha
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((show: any) => {
        const showDate = new Date(show.date);
        const showDay = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate());
        
        if (dateFilter === 'today') {
          return showDay.getTime() === today.getTime();
        } else if (dateFilter === 'week') {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(today.getDate() + 7);
          return showDay >= today && showDay <= weekFromNow;
        } else if (dateFilter === 'month') {
          const monthFromNow = new Date(today);
          monthFromNow.setMonth(today.getMonth() + 1);
          return showDay >= today && showDay <= monthFromNow;
        }
        return true;
      });
    }

    setFilteredShows(filtered);
    setCurrentPage(1); // Resetear a página 1 cuando cambian los filtros
  }, [searchTerm, venueFilter, sourceFilter, dateFilter, shows]);

  // Extraer venues únicos
  const uniqueVenues = Array.from(
    new Set(shows.map((show: any) => show.venue))
  ).sort();

  // Calcular paginación
  const totalPages = Math.ceil(filteredShows.length / SHOWS_PER_PAGE);
  const startIndex = (currentPage - 1) * SHOWS_PER_PAGE;
  const endIndex = startIndex + SHOWS_PER_PAGE;
  const currentShows = filteredShows.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600
            dark:from-blue-400 dark:via-purple-400 dark:to-red-400 bg-clip-text text-transparent font-sans">
            🎫 SHOWS EN CÓRDOBA
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-semibold">
            Descubre todos los próximos conciertos y eventos en la ciudad
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar show, artista o venue..."
            startContent={<FiSearch />}
            value={searchTerm}
            onValueChange={setSearchTerm}
            isClearable
            onClear={() => setSearchTerm('')}
          />
          
          <select
            className="px-3 py-2 rounded-lg border-2 border-default-200 bg-background hover:border-default-400 focus:border-primary outline-none transition-colors"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
          >
            <option value="">Todos los venues</option>
            {uniqueVenues.map((venue: string) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2 rounded-lg border-2 border-default-200 bg-background hover:border-default-400 focus:border-primary outline-none transition-colors"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">Todas las fuentes</option>
            <option value="laestacion">La Estación</option>
            <option value="lafabrica">La Fábrica</option>
          </select>
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-default-500">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredShows.length)} de {filteredShows.length} shows
              {filteredShows.length !== shows.length && ` (${shows.length} total)`}
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-default-500">
                Página {currentPage} de {totalPages}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-12 text-default-500">
            <p>No se encontraron shows con los filtros seleccionados</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setVenueFilter('');
                setSourceFilter('');
              }}
              className="mt-4 text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentShows.map((show: any) => (
                <RetroShowCard key={show.id} show={show} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <Button
                  isIconOnly
                  variant="flat"
                  isDisabled={currentPage === 1}
                  onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  <FiChevronLeft size={20} />
                </Button>

                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  showControls={false}
                  size="lg"
                  color="primary"
                  className="gap-2"
                />

                <Button
                  isIconOnly
                  variant="flat"
                  isDisabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  <FiChevronRight size={20} />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ShowsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <NavBar />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    }>
      <ShowsPageContent />
    </Suspense>
  );
}
