import { NextResponse, NextRequest } from 'next/server';

/**
 * Vercel Cron Endpoint - Runs weekly to scrape new events
 * 
 * Security: Only accepts requests with valid SCRAPER_API_KEY
 * Scheduled: Every Sunday at 2 AM UTC (configurable in vercel.json)
 * 
 * Note: Import scrapers only when needed (lazy loading to avoid build issues)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const scraperKey = process.env.SCRAPER_API_KEY;

    if (!scraperKey) {
      console.error('❌ SCRAPER_API_KEY not configured');
      return NextResponse.json(
        { error: 'Scraper not configured' },
        { status: 503 }
      );
    }

    const expectedToken = `Bearer ${scraperKey}`;
    if (authHeader !== expectedToken) {
      console.warn('⚠️ Unauthorized scraper request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🎭 Starting weekly scrape...');
    const startTime = Date.now();

    // Lazy load scrapers to avoid build issues
    const { scrapeEstacion } = await import('@/services/scraper-estacion');
    const { scrapeFabrica } = await import('@/services/scraper-fabrica');

    // Run both scrapers in parallel
    const [estacionResults, fabricaResults] = await Promise.all([
      scrapeEstacion().catch(err => ({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        venue: 'La Estación'
      })),
      scrapeFabrica().catch(err => ({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        venue: 'La Fábrica'
      }))
    ]);

    const duration = Date.now() - startTime;

    console.log('✅ Scraping completed', {
      duration: `${duration}ms`
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results: {
        estacion: estacionResults,
        fabrica: fabricaResults
      }
    });

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Prevent direct POST access
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
