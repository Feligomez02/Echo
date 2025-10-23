import { scrapeEstacion, saveEstacionShows } from '../services/scraper-estacion';

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚉 SCRAPING DE LA ESTACIÓN CÓRDOBA');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Scrapear shows
    console.log('📡 Iniciando scraping de La Estación...\n');
    const shows = await scrapeEstacion();

    if (shows.length === 0) {
      console.log('\n⚠️ No se encontraron shows en La Estación');
      console.log('\nPosibles causas:');
      console.log('- La estructura HTML cambió');
      console.log('- No hay eventos publicados');
      console.log('- Problema de conexión');
      return;
    }

    console.log(`\n📊 Shows encontrados: ${shows.length}`);

    // Mostrar primeros shows
    console.log('\n📋 Shows extraídos:\n');
    shows.forEach((show, index) => {
      console.log(`${index + 1}. ${show.name}`);
      console.log(`   🎤 Artist: ${show.artist}`);
      console.log(
        `   📅 Date: ${show.date.toLocaleString('es-AR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      );
      console.log(`   📍 Venue: ${show.venue}`);
      if (show.description) {
        console.log(`   📝 Description: ${show.description.substring(0, 100)}...`);
      }
      if (show.imageUrl) console.log(`   🖼️  Image: ${show.imageUrl}`);
      if (show.ticketUrl) console.log(`   🎟️  Tickets: ${show.ticketUrl}`);
      console.log('');
    });

    // 2. Guardar en base de datos
    console.log('─'.repeat(50));
    const result = await saveEstacionShows(shows);

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Revisa los shows en: http://localhost:3000/shows');
    console.log('2. Verifica que las fechas se parsearon correctamente');
    console.log('3. Ajusta el scraper si es necesario');
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
