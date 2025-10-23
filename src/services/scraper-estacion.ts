import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ScrapedShow } from './scraper-puppeteer';

// Agregar el plugin stealth para evitar detección
puppeteer.use(StealthPlugin());

/**
 * Scrapea eventos de La Estación Córdoba
 */
export async function scrapeEstacion(): Promise<ScrapedShow[]> {
  console.log('🚉 Scraping La Estación Córdoba...');
  
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

    console.log('📡 Navegando a laestacioncordoba.com...');

    // Navegar a la página
    await page.goto('https://laestacioncordoba.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Esperar a que carguen los shows
    await page.waitForSelector('.DF_utQ._682gpw._0xkaeQ', { timeout: 10000 });

    console.log('✅ Página cargada, extrayendo shows...');

    // Extraer información de los shows
    const shows = await page.evaluate(() => {
      // Buscar todos los spans con clase a_GcMg
      const allSpans = document.querySelectorAll('span.a_GcMg');
      const extractedShows: any[] = [];
      
      // Agrupar spans por eventos
      const showsData: any[] = [];
      let currentShow: any = { artists: [], dates: [], venues: [], times: [], hasDate: false };
      
      allSpans.forEach((span) => {
        const text = span.textContent?.trim() || '';
        const style = (span as HTMLElement).style;
        const fontWeight = style.fontWeight;
        
        // Detectar si es fecha (contiene días de la semana o meses)
        const datePattern = /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+\d+\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
        const venuePattern = /LA ESTACION|OUTDOOR|INDOOR/i;
        const isDate = datePattern.test(text);
        const isVenue = venuePattern.test(text);
        
        // Si encontramos una fecha, es el inicio de un nuevo show
        if (isDate && fontWeight === '400') {
          // Guardar el show anterior si tiene fecha válida
          if (currentShow.hasDate && currentShow.artists.length > 0) {
            showsData.push({ ...currentShow });
          }
          // Iniciar nuevo show
          currentShow = { artists: [], dates: [text], venues: [], times: [], hasDate: true };
        }
        // Venue (viene después de la fecha)
        else if (isVenue && fontWeight === '400') {
          currentShow.venues.push(text);
        }
        // Artistas tienen font-weight: 800
        else if (fontWeight === '800' && text.length > 0) {
          // Filtrar textos que claramente no son artistas
          const ignoredTexts = /^(NUESTRAS MARCAS|SEGUINOS|CONTACTO|INFO)$/i;
          if (!ignoredTexts.test(text)) {
            currentShow.artists.push(text);
          }
        }
        // Otros textos con weight 400 podrían ser artistas secundarios
        else if (fontWeight === '400' && text.length > 0 && !isDate && !isVenue) {
          // Solo agregar si ya tenemos fecha y venue (es parte del lineup)
          if (currentShow.hasDate && currentShow.venues.length > 0) {
            const ignoredTexts = /^(LA ESTACION|OUTDOOR|INDOOR|NUESTRAS MARCAS|SEGUINOS)$/i;
            if (!ignoredTexts.test(text) && text.length < 50) {
              currentShow.artists.push(text);
            }
          }
        }
      });
      
      // Agregar el último show si tiene fecha válida
      if (currentShow.hasDate && currentShow.artists.length > 0) {
        showsData.push(currentShow);
      }

      // Buscar imágenes y enlaces para cada show
      const allImages = Array.from(document.querySelectorAll('img'))
        .map(img => (img as HTMLImageElement).src)
        .filter(src => !src.startsWith('blob:') && src.includes('_assets')); // Filtrar blobs e iconos
      
      const allLinks = Array.from(document.querySelectorAll('a[href*="paseshow"], a[href*="ticketpass"], a[href*="ticket"]'))
        .map(link => (link as HTMLAnchorElement).href)
        .filter((url, index, self) => self.indexOf(url) === index); // Eliminar duplicados

      // Convertir a formato de shows
      showsData.forEach((show, index) => {
        // Usar la primera imagen disponible, o la del índice correspondiente
        const imageUrl = allImages[index] || allImages[0] || '';
        const ticketUrl = allLinks[index] || allLinks[0] || 'https://laestacioncordoba.com/';
        
        extractedShows.push({
          name: show.artists[0] || 'Show sin título',
          artists: show.artists,
          textContent: JSON.stringify(show),
          dateText: show.dates[0] || '',
          timeText: '', // Por ahora no capturamos hora
          venue: show.venues[0] || 'LA ESTACION CÓRDOBA',
          ticketUrl,
          imageUrl,
          html: '',
        });
      });

      return extractedShows;
    });

    console.log(`✅ Encontrados ${shows.length} elementos de shows`);

    // Procesar y normalizar los shows extraídos
    const normalizedShows: ScrapedShow[] = [];
    const now = new Date();

    for (const show of shows) {
      try {
        // Normalizar el show
        const normalized = normalizeEstacionShow(show);
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
    console.error('❌ Error scraping La Estación:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Normaliza datos de un show de La Estación
 */
function normalizeEstacionShow(rawShow: any): ScrapedShow | null {
  try {
    const name = rawShow.name || 'Evento La Estación';
    
    // Usar los artistas extraídos o el nombre como fallback
    const artist = rawShow.artists && rawShow.artists.length > 0 
      ? rawShow.artists.join(', ') 
      : name;

    // Parsear fecha desde el texto en español
    let date = new Date();
    
    if (rawShow.dateText) {
      // Ejemplo: "VIERNES 31 DE OCTUBRE"
      const monthNames: { [key: string]: number } = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
      };

      const match = rawShow.dateText.match(/(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
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
        // Formato DD/MM/YYYY o DD-MM-YYYY
        const numericMatch = rawShow.dateText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (numericMatch) {
          const day = parseInt(numericMatch[1]);
          const month = parseInt(numericMatch[2]) - 1;
          let year = parseInt(numericMatch[3]);
          if (year < 100) year += 2000;
          date = new Date(year, month, day, 20, 0, 0);
        } else {
          // Sin fecha válida, usar placeholder de 30 días en el futuro
          date.setDate(date.getDate() + 30);
          date.setHours(20, 0, 0, 0);
        }
      }
    } else {
      // Sin fecha, usar placeholder de 30 días en el futuro
      date.setDate(date.getDate() + 30);
      date.setHours(20, 0, 0, 0);
    }

    // Ajustar hora si está disponible
    if (rawShow.timeText) {
      const timeMatch = rawShow.timeText.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        date.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      }
    }

    const venue = rawShow.venue || 'La Estación Córdoba';
    const city = 'Córdoba';
    const imageUrl = rawShow.imageUrl || undefined;
    const ticketUrl = rawShow.ticketUrl || 'https://laestacioncordoba.com/';

    // Descripción del contenido del texto
    const description = rawShow.textContent
      ? rawShow.textContent.substring(0, 200).trim()
      : undefined;

    return {
      name,
      artist,
      description,
      date,
      venue,
      city,
      imageUrl,
      ticketUrl,
      source: 'laestacion',
    };
  } catch (error) {
    console.error(`Error normalizing La Estación show:`, error);
    return null;
  }
}

/**
 * Guarda los shows de La Estación en la base de datos
 */
export async function saveEstacionShows(shows: ScrapedShow[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log('\n💾 Guardando shows de La Estación en la base de datos...');
  console.log(`📝 Verificando duplicados para ${shows.length} shows...\n`);

  for (const show of shows) {
    try {
      // Buscar si ya existe (por nombre, fecha y venue)
      const existing = await prisma.show.findFirst({
        where: {
          name: show.name,
          date: show.date,
          venue: show.venue,
        },
      });

      if (existing) {
        const hasChanges =
          existing.artist !== show.artist ||
          existing.description !== show.description ||
          existing.imageUrl !== show.imageUrl ||
          existing.ticketUrl !== show.ticketUrl;

        if (hasChanges) {
          await prisma.show.update({
            where: { id: existing.id },
            data: {
              artist: show.artist,
              description: show.description,
              city: show.city,
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              source: show.source,
            },
          });
          updated++;
          console.log(`   ✏️  Actualizado: ${show.name}`);
        } else {
          skipped++;
          if (skipped <= 3) {
            console.log(`   ⏭️  Ya existe: ${show.name}`);
          }
        }
      } else {
        // Obtener o crear la venue
        let venue = await prisma.venue.findUnique({
          where: { name: 'La Estación' },
        });

        if (!venue) {
          venue = await prisma.venue.create({
            data: {
              name: 'La Estación',
              city: 'Córdoba',
              address: 'Av. Hipólito Yrigoyen 348, Córdoba',
              website: 'https://www.laestacioncordoba.com',
              source: 'estacion',
              active: true,
            },
          });
        }

        // Crear el show con venueId
        await prisma.show.create({
          data: {
            ...show,
            venueId: venue.id,
          },
        });
        created++;
        console.log(`   ✨ Nuevo: ${show.name}`);
      }
    } catch (error) {
      console.error(`   ❌ Error guardando "${show.name}":`, error);
      skipped++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('📊 Resumen de guardado (La Estación):');
  console.log(`   ✨ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log('─'.repeat(50));

  return { created, updated, skipped };
}
