#!/usr/bin/env tsx

/**
 * Script para ejecutar todos los scrapers en secuencia
 */

import { scrapePassline, saveScrapedShows } from '../services/scraper-puppeteer';
import { scrapeTicketek, saveTicketekShows } from '../services/scraper-ticketek';
import { scrapeEstacion, saveEstacionShows } from '../services/scraper-estacion';

console.log('═══════════════════════════════════════════════════');
console.log('🎭 SCRAPING DE TODOS LOS SHOWS DE CÓRDOBA');
console.log('═══════════════════════════════════════════════════\n');

async function scrapeAll() {
  try {
    // 1. Passline
    console.log('━━━ 1/3: PASSLINE ━━━\n');
    const passlineShows = await scrapePassline();
    console.log(`✅ Extraídos ${passlineShows.length} shows de Passline\n`);
    
    const passlineStats = await saveScrapedShows(passlineShows);
    console.log('📊 Estadísticas Passline:');
    console.log(`   ✨ Creados: ${passlineStats.created}`);
    console.log(`   ✏️  Actualizados: ${passlineStats.updated}`);
    console.log(`   ⏭️  Omitidos: ${passlineStats.skipped}\n`);

    // 2. Ticketek
    console.log('━━━ 2/3: TICKETEK ━━━\n');
    const ticketekShows = await scrapeTicketek();
    console.log(`✅ Extraídos ${ticketekShows.length} shows de Ticketek\n`);
    
    const ticketekStats = await saveTicketekShows(ticketekShows);
    console.log('📊 Estadísticas Ticketek:');
    console.log(`   ✨ Creados: ${ticketekStats.created}`);
    console.log(`   ✏️  Actualizados: ${ticketekStats.updated}`);
    console.log(`   ⏭️  Omitidos: ${ticketekStats.skipped}\n`);

    // 3. La Estación
    console.log('━━━ 3/3: LA ESTACIÓN ━━━\n');
    const estacionShows = await scrapeEstacion();
    console.log(`✅ Extraídos ${estacionShows.length} shows de La Estación\n`);
    
    const estacionStats = await saveEstacionShows(estacionShows);
    console.log('📊 Estadísticas La Estación:');
    console.log(`   ✨ Creados: ${estacionStats.created}`);
    console.log(`   ✏️  Actualizados: ${estacionStats.updated}`);
    console.log(`   ⏭️  Omitidos: ${estacionStats.skipped}\n`);

    // Resumen final
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 RESUMEN GENERAL');
    console.log('═══════════════════════════════════════════════════');
    
    const totalExtracted = passlineShows.length + ticketekShows.length + estacionShows.length;
    const totalCreated = passlineStats.created + ticketekStats.created + estacionStats.created;
    const totalUpdated = passlineStats.updated + ticketekStats.updated + estacionStats.updated;
    const totalSkipped = passlineStats.skipped + ticketekStats.skipped + estacionStats.skipped;

    console.log(`\n📊 Shows extraídos: ${totalExtracted}`);
    console.log(`   • Passline: ${passlineShows.length}`);
    console.log(`   • Ticketek: ${ticketekShows.length}`);
    console.log(`   • La Estación: ${estacionShows.length}`);
    
    console.log(`\n💾 Shows guardados en base de datos:`);
    console.log(`   ✨ Creados: ${totalCreated}`);
    console.log(`   ✏️  Actualizados: ${totalUpdated}`);
    console.log(`   ⏭️  Omitidos: ${totalSkipped}`);

    console.log('\n✅ Proceso completado exitosamente!');
    console.log('\n👋 Próximos pasos:');
    console.log('   1. Revisa los shows en: http://localhost:3000/shows');
    console.log('   2. Verifica que los datos se hayan importado correctamente');
    console.log('   3. Usa el filtro por fuente para ver shows de cada plataforma\n');

  } catch (error) {
    console.error('❌ Error durante el scraping:', error);
    process.exit(1);
  }
}

scrapeAll();
