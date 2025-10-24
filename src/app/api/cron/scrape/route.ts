import { NextResponse, NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Vercel Cron Endpoint - Informational only
 * 
 * Scraping is performed locally on development machine and data is pushed to Supabase.
 * This endpoint is kept for monitoring purposes and future webhook integrations.
 * 
 * Note: Puppeteer cannot run on Vercel serverless (128MB limit, no binary support).
 * Use `npm run scrape:both` locally to update the database.
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

    console.log('ℹ️ Scraper endpoint called - Puppeteer scraping must be done locally');

    return NextResponse.json({
      success: true,
      message: 'Scraping is performed locally. Run "npm run scrape:both" on your development machine.',
      timestamp: new Date().toISOString(),
      instructions: {
        local: 'npm run scrape:both',
        effect: 'Updates Supabase database shared between dev and production',
        note: 'Puppeteer cannot run on Vercel serverless (128MB limit)'
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
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

