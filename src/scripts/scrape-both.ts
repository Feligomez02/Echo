/**
 * Script para ejecutar ambos scrapers (La Estación y La Fábrica)
 * y guardar los eventos reales en la base de datos
 */

import { scrapeEstacion, saveEstacionShows } from '../services/scraper-estacion';
import { scrapeFabrica, saveFabricaShows } from '../services/scraper-fabrica';

async function main() {
  try {
    console.log('🎭 INICIANDO SCRAPING DE EVENTOS REALES\n');
    console.log('═'.repeat(60));

    // Scrape La Estación
    console.log('\n1️⃣  Scrapeando La Estación...\n');
    let estacionShows = await scrapeEstacion();
    console.log(`✅ Extraídos ${estacionShows.length} shows de La Estación\n`);

    let estacionStats = await saveEstacionShows(estacionShows);
    console.log(`\n✅ Guardados: ${estacionStats.created} nuevos, ${estacionStats.updated} actualizados\n`);

    // Scrape La Fábrica
    console.log('\n2️⃣  Scrapeando La Fábrica...\n');
    let fabricaShows = await scrapeFabrica();
    console.log(`✅ Extraídos ${fabricaShows.length} shows de La Fábrica\n`);

    let fabricaStats = await saveFabricaShows(fabricaShows);
    console.log(`\n✅ Guardados: ${fabricaStats.created} nuevos, ${fabricaStats.updated} actualizados\n`);

    // Resumen final
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN FINAL DEL SCRAPING\n');
    console.log(`La Estación: ${estacionStats.created} nuevos, ${estacionStats.updated} actualizados`);
    console.log(`La Fábrica:  ${fabricaStats.created} nuevos, ${fabricaStats.updated} actualizados`);
    console.log(`\n✨ Total nuevo: ${estacionStats.created + fabricaStats.created} eventos`);
    console.log(`🔄 Total actualizado: ${estacionStats.updated + fabricaStats.updated} eventos`);
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error en el scraping:', error);
    process.exit(1);
  }
}

main();
