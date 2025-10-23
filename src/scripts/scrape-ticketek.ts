import {
  scrapeTicketek,
  scrapeCordobaShowsTicketek,
  saveTicketekShows,
} from '../services/scraper-ticketek';

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🎫 SCRAPING DE TICKETEK - CÓRDOBA');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Scrapear shows
    console.log('📡 Iniciando scraping de Ticketek...\n');
    const shows = await scrapeCordobaShowsTicketek();

    if (shows.length === 0) {
      console.log('\n⚠️ No se encontraron shows en Ticketek');
      return;
    }

    console.log(`\n📊 Shows encontrados: ${shows.length}`);

    // Mostrar breakdown por venue
    const venueCount = shows.reduce((acc, show) => {
      acc[show.venue] = (acc[show.venue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📍 Shows por venue:');
    Object.entries(venueCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([venue, count]) => {
        console.log(`   - ${venue}: ${count} show(s)`);
      });

    // Mostrar breakdown por artista
    const artistCount = shows.reduce((acc, show) => {
      acc[show.artist] = (acc[show.artist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🎤 Top artistas:');
    Object.entries(artistCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([artist, count]) => {
        console.log(`   - ${artist}: ${count} show(s)`);
      });

    // Mostrar primeros 5 shows
    console.log('\n📋 Primeros 5 shows:\n');
    shows.slice(0, 5).forEach((show, index) => {
      console.log(`${index + 1}. ${show.name}`);
      console.log(`   🎤 Artist: ${show.artist}`);
      console.log(
        `   📅 Date: ${show.date.toLocaleString('es-AR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      );
      console.log(`   📍 Venue: ${show.venue}, ${show.city}`);
      if (show.imageUrl) console.log(`   🖼️  Image: ${show.imageUrl}`);
      if (show.ticketUrl) console.log(`   🎟️  Tickets: ${show.ticketUrl}`);
      console.log('');
    });

    // 2. Guardar en base de datos
    console.log('─'.repeat(50));
    const result = await saveTicketekShows(shows);

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Revisa los shows en: http://localhost:3000/shows');
    console.log('2. Combina con Passline para tener ambas fuentes');
    console.log('3. Configura scraping automático diario');
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('\n👋 Finalizando proceso...');
  });
