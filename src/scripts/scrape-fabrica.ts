/**
 * Script para scrapeaar eventos de La Fábrica
 * Lee desde https://linktr.ee/LaFabricaTickets
 */

import { scrapeFabrica, saveFabricaShows } from '../services/scraper-fabrica';

async function main() {
  try {
    console.log('🏭 SCRAPEANDO LA FÁBRICA CÓRDOBA\n');

    // Scrapear los eventos
    const shows = await scrapeFabrica();

    console.log(`\n✅ Encontrados ${shows.length} eventos en La Fábrica\n`);

    // Mostrar previsualizacion
    if (shows.length > 0) {
      console.log('📋 Previsualizacion de eventos:\n');
      shows.slice(0, 3).forEach((show, index) => {
        console.log(`${index + 1}. ${show.artist}`);
        console.log(`   Fecha: ${show.date.toLocaleDateString('es-AR')}`);
        console.log(`   Entradas: ${show.ticketUrl}\n`);
      });
    }

    // Guardar en la base de datos
    const result = await saveFabricaShows(shows);

    console.log('\n' + '─'.repeat(50));
    console.log('✨ Resumen:');
    console.log(`   Creados: ${result.created}`);
    console.log(`   Actualizados: ${result.updated}`);
    console.log(`   Omitidos: ${result.skipped}`);
    console.log('─'.repeat(50));

    if (result.created === 0 && result.updated === 0) {
      console.log(
        '\n⚠️ No se encontraron eventos nuevos o con cambios. Posible razón:\n' +
        '  • No hay eventos próximos en La Fábrica\n' +
        '  • La página web cambió su estructura\n' +
        '  • Los eventos ya están en la base de datos\n'
      );
    }

    console.log('\n✅ Scraping completado.\n');
    console.log('3. Ajusta el scraper si es necesario');

  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
    console.error('\nProblemas comunes:');
    console.error('  • Cambios en la estructura HTML de La Fábrica');
    console.error('  • Timeout de conexión (sitio lento o caído)');
    console.error('  • Bloqueo de puppeteer (necesita actualización)');
    process.exit(1);
  }
}

main();
