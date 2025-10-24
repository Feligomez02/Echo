import { supabase } from '@/lib/supabase';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ScrapedShow } from './scraper-puppeteer';

// Agregar el plugin stealth para evitar detección
puppeteer.use(StealthPlugin());

/**
 * Scrapea eventos de La Fábrica Córdoba desde Linktree
 */
export async function scrapeFabrica(): Promise<ScrapedShow[]> {
  console.log('🏭 Scraping La Fábrica Córdoba (via Linktree)...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    const page = await browser.newPage();

    // Configurar viewport y user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');

    console.log('📡 Navegando a linktr.ee/LaFabricaTickets...');

    // Navegar a la página Linktree
    await page.goto('https://linktr.ee/LaFabricaTickets', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Esperar a que carguen los links
    await page.waitForSelector('a[data-testid="LinkClickTriggerLink"]', { timeout: 10000 });

    console.log('✅ Página cargada, extrayendo shows...');

    // Extraer información de los shows
    const shows = await page.evaluate(() => {
      const extractedShows: any[] = [];
      
      // Buscar todos los links con los shows
      const links = document.querySelectorAll('a[data-testid="LinkClickTriggerLink"]');
      
      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        
        // Buscar el div con la información del show
        const titleDiv = link.querySelector('div[data-testid="NewLinkChin"] div:last-child');
        const titleText = titleDiv?.textContent?.trim() || '';
        
        // Buscar la imagen
        const img = link.querySelector('img');
        const imageUrl = img?.src || '';
        
        // Filtrar: descartar si dice "mesas VIP" o "Reserva"
        if (titleText.toLowerCase().includes('mesas vip') || 
            titleText.toLowerCase().includes('reserva')) {
          return; // Saltarse este elemento
        }
        
        // Filtrar: descartar si dice "preventa" (presale - se puede incluir o no según preferencia)
        // Descomentar la siguiente línea si quieres descartar preventas
        // if (titleText.toLowerCase().includes('preventa')) {
        //   return;
        // }
        
        // Solo procesar si tiene texto válido y URL
        if (titleText && href) {
          extractedShows.push({
            titleText,
            href,
            imageUrl,
          });
        }
      });

      return extractedShows;
    });

    console.log(`✅ Encontrados ${shows.length} eventos`);

    // Procesar y normalizar los shows extraídos
    const normalizedShows: ScrapedShow[] = [];
    const now = new Date();

    for (const show of shows) {
      try {
        // Normalizar el show
        const normalized = normalizeFabricaShow(show);
        if (normalized && normalized.date >= now) {
          normalizedShows.push(normalized);
        }
      } catch (error) {
        console.error(`Error normalizando show:`, error);
      }
    }

    console.log(`📅 Filtrados a ${normalizedShows.length} shows próximos`);
    return normalizedShows;

  } catch (error) {
    console.error('❌ Error scraping La Fábrica:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Normaliza datos de un show de La Fábrica
 * Formato esperado: "ARTISTA | DD DE MES | LA FABRICA"
 */
function normalizeFabricaShow(rawShow: any): ScrapedShow | null {
  try {
    const titleText = rawShow.titleText || '';
    
    // Parsear formato: "ARTISTA | DD DE MES | VENUE"
    const parts = titleText.split('|').map((p: string) => p.trim());
    
    if (parts.length < 2) {
      console.warn(`⚠️ No se pudo parsear: ${titleText}`);
      return null;
    }

    const artist = parts[0] || 'Evento La Fábrica';
    const name = artist;
    
    // Parsear fecha del segundo segmento
    let date = new Date();
    const dateText = parts[1];
    
    if (dateText) {
      // Ejemplo: "14 DE NOVIEMBRE" o "14 DE OCTUBRE"
      const monthNames: { [key: string]: number } = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
      };

      const match = dateText.match(/(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
      if (match) {
        const day = parseInt(match[1]);
        const month = monthNames[match[2].toLowerCase()];
        let year = new Date().getFullYear();
        
        // Si el mes ya pasó este año, usar el próximo año
        const testDate = new Date(year, month, day);
        if (testDate < new Date()) {
          year++;
        }
        
        date = new Date(year, month, day, 20, 0, 0);
      } else {
        // Sin fecha válida, usar placeholder de 30 días en el futuro
        date.setDate(date.getDate() + 30);
        date.setHours(20, 0, 0, 0);
      }
    } else {
      // Sin fecha, usar placeholder de 30 días en el futuro
      date.setDate(date.getDate() + 30);
      date.setHours(20, 0, 0, 0);
    }

    const venue = 'La Fábrica';
    const city = 'Córdoba';
    const ticketUrl = rawShow.href || 'https://linktr.ee/LaFabricaTickets';
    const imageUrl = rawShow.imageUrl || undefined;
    const description = `${artist} en La Fábrica Córdoba - ${dateText}`;

    // Detectar si es preventa
    const isPresale = titleText.toLowerCase().includes('preventa');
    const status = isPresale ? 'presale' : 'on-sale';

    return {
      name,
      artist,
      description,
      date,
      venue,
      city,
      imageUrl,
      ticketUrl,
      source: 'lafabrica',
    };
  } catch (error) {
    console.error(`Error normalizing La Fábrica show:`, error);
    return null;
  }
}

/**
 * Guarda los shows de La Fábrica en la base de datos
 */
export async function saveFabricaShows(shows: ScrapedShow[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log('\n💾 Guardando shows de La Fábrica en la base de datos...');
  console.log(`📝 Verificando duplicados para ${shows.length} shows...\n`);

  for (const show of shows) {
    try {
      // Buscar si ya existe (por nombre, fecha y venue)
      const { data: existing } = await supabase
        .from('Show')
        .select('*')
        .eq('name', show.name)
        .eq('date', show.date)
        .eq('venue', show.venue)
        .single();

      if (existing) {
        const hasChanges =
          existing.artist !== show.artist ||
          existing.description !== show.description ||
          existing.imageUrl !== show.imageUrl ||
          existing.ticketUrl !== show.ticketUrl;

        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('Show')
            .update({
              artist: show.artist,
              description: show.description,
              city: show.city,
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              source: show.source,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateError) {
            updated++;
            console.log(`   ✏️  Actualizado: ${show.name}`);
          } else {
            throw updateError;
          }
        } else {
          skipped++;
          if (skipped <= 3) {
            console.log(`   ⏭️  Ya existe: ${show.name}`);
          }
        }
      } else {
        // Crear el show directamente en Supabase
        const { error: insertError } = await supabase
          .from('Show')
          .insert({
            ...show,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        if (!insertError) {
          created++;
          console.log(`   ✨ Nuevo: ${show.name}`);
        } else {
          throw insertError;
        }
      }
    } catch (error) {
      console.error(`   ❌ Error guardando "${show.name}":`, error);
      skipped++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('📊 Resumen de guardado (La Fábrica):');
  console.log(`   ✨ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log('─'.repeat(50));

  return { created, updated, skipped };
}
