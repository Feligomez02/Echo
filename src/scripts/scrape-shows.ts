import { scrapeCordobaShows, saveScrapedShows, getScrapingStats } from '../services/scraper-puppeteer';

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🎵 SCRAPING DE SHOWS EN CÓRDOBA');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Scrapear shows
    console.log('📡 Iniciando scraping...\n');
    const shows = await scrapeCordobaShows();

    if (shows.length === 0) {
      console.log('\n⚠️ No se encontraron shows nuevos');
      console.log('\nTips:');
      console.log('- Verifica que la API de Passline esté disponible');
      console.log('- Revisa el código de región (actualmente "6" para Córdoba)');
      console.log('- Ejecuta el test: npm run scrape:test');
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
      .slice(0, 5)
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
      .slice(0, 5)
      .forEach(([artist, count]) => {
        console.log(`   - ${artist}: ${count} show(s)`);
      });

    // 2. Guardar en base de datos
    console.log('\n' + '─'.repeat(50));
    const result = await saveScrapedShows(shows);

    // 3. Mostrar estadísticas finales
    console.log('\n' + '═'.repeat(50));
    console.log('📊 ESTADÍSTICAS FINALES');
    console.log('═'.repeat(50));
    
    const stats = await getScrapingStats();
    console.log(`\n📈 Total en base de datos: ${stats.total} shows`);
    console.log(`   - Próximos: ${stats.upcoming}`);
    console.log(`   - Pasados: ${stats.past}`);
    
    if (stats.bySources.length > 0) {
      console.log('\n📡 Por fuente:');
      stats.bySources.forEach((item: { source: string; count: number }) => {
        console.log(`   - ${item.source}: ${item.count}`);
      });
    }

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Revisa los shows en: http://localhost:3000/shows');
    console.log('2. Configura un cron job para scraping automático');
    console.log('3. Agrega más fuentes de datos (Ticketek, etc.)');
    console.log('\n📚 Documentación: SCRAPING.md');

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
