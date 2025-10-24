/**
 * Script para ejecutar ambos scrapers (La Estación y La Fábrica)
 * y guardar los eventos en Supabase (local y production)
 */

import { scrapeEstacion } from '../services/scraper-estacion';
import { scrapeFabrica } from '../services/scraper-fabrica';

async function saveShowsToSupabase(shows: any[], venue: string) {
  console.log(`\n📤 Sending ${shows.length} shows from ${venue} to Supabase...`);
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const scraperKey = process.env.SCRAPER_API_KEY;

    if (!scraperKey) {
      console.error('❌ SCRAPER_API_KEY not set in environment variables');
      return { created: 0, updated: 0, skipped: 0 };
    }

    const response = await fetch(`${apiUrl}/api/admin/scrape/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${scraperKey}`,
      },
      body: JSON.stringify({ shows, venue }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error from API (${response.status}):`, error);
      return { created: 0, updated: 0, skipped: 0 };
    }

    const result = await response.json();
    console.log(`✅ API Response: ${result.stats.created} created, ${result.stats.updated} updated, ${result.stats.skipped} skipped`);
    
    if (result.errors && result.errors.length > 0) {
      console.warn('⚠️ Some errors occurred:');
      result.errors.slice(0, 3).forEach((err: string) => console.warn(`  - ${err}`));
    }

    return result.stats;
  } catch (error) {
    console.error('❌ Failed to save shows:', error);
    return { created: 0, updated: 0, skipped: 0 };
  }
}

async function main() {
  try {
    console.log('🎭 INICIANDO SCRAPING DE EVENTOS\n');
    console.log('═'.repeat(60));

    // Scrape La Estación
    console.log('\n1️⃣  Scrapeando La Estación...\n');
    let estacionShows = await scrapeEstacion();
    console.log(`✅ Extraídos ${estacionShows.length} shows de La Estación`);

    let estacionStats = await saveShowsToSupabase(estacionShows, 'La Estación');

    // Scrape La Fábrica
    console.log('\n2️⃣  Scrapeando La Fábrica...\n');
    let fabricaShows = await scrapeFabrica();
    console.log(`✅ Extraídos ${fabricaShows.length} shows de La Fábrica`);

    let fabricaStats = await saveShowsToSupabase(fabricaShows, 'La Fábrica');

    // Resumen final
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN FINAL DEL SCRAPING\n');
    console.log(`La Estación: ${estacionStats.created} nuevos, ${estacionStats.updated} actualizados, ${estacionStats.skipped} omitidos`);
    console.log(`La Fábrica:  ${fabricaStats.created} nuevos, ${fabricaStats.updated} actualizados, ${fabricaStats.skipped} omitidos`);
    console.log(`\n✨ Total nuevo: ${estacionStats.created + fabricaStats.created} eventos`);
    console.log(`🔄 Total actualizado: ${estacionStats.updated + fabricaStats.updated} eventos`);
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error en el scraping:', error);
    process.exit(1);
  }
}

main();

