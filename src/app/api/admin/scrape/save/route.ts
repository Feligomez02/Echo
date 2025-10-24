export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';

/**
 * Admin endpoint to save scraped shows to Supabase
 * Called from local machine after scraping
 * 
 * Security: Requires valid SCRAPER_API_KEY header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const scraperKey = process.env.SCRAPER_API_KEY;

    if (!scraperKey) {
      return NextResponse.json(
        { error: 'Scraper not configured on server' },
        { status: 503 }
      );
    }

    const expectedToken = `Bearer ${scraperKey}`;
    if (authHeader !== expectedToken) {
      console.warn('⚠️ Unauthorized scraper save request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shows, venue } = body;

    if (!shows || !Array.isArray(shows)) {
      return NextResponse.json(
        { error: 'Invalid payload: shows array required' },
        { status: 400 }
      );
    }

    if (!venue) {
      return NextResponse.json(
        { error: 'Invalid payload: venue required' },
        { status: 400 }
      );
    }

    console.log(`📥 Received ${shows.length} shows from ${venue}`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each show
    for (const show of shows) {
      try {
        // Validate required fields
        if (!show.name || !show.date || !show.artist) {
          skipped++;
          continue;
        }

        // Check if show already exists
        const { data: existing } = await supabase
          .from('Show')
          .select('id, description')
          .eq('name', show.name)
          .eq('date', show.date)
          .eq('venue', show.venue)
          .single();

        if (existing) {
          // Update if there are changes
          const { error: updateError } = await supabase
            .from('Show')
            .update({
              description: show.description || existing.description,
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              artist: show.artist,
              city: show.city || 'Córdoba',
              source: show.source || venue,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (!updateError) {
            updated++;
          } else {
            errors.push(`Error updating ${show.name}: ${updateError.message}`);
            skipped++;
          }
        } else {
          // Create new show
          const showId = generateUUID();
          const { error: createError } = await supabase
            .from('Show')
            .insert({
              id: showId,
              name: show.name,
              artist: show.artist,
              description: show.description,
              date: show.date,
              venue: show.venue,
              city: show.city || 'Córdoba',
              imageUrl: show.imageUrl,
              ticketUrl: show.ticketUrl,
              source: show.source || venue,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

          if (!createError) {
            created++;
          } else {
            errors.push(`Error creating ${show.name}: ${createError.message}`);
            skipped++;
          }
        }
      } catch (error) {
        errors.push(`Error processing ${show.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        skipped++;
      }
    }

    console.log(`✅ Save completed: ${created} created, ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      venue,
      stats: {
        total: shows.length,
        created,
        updated,
        skipped,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Error saving shows:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save shows',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Prevent GET/other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to save scraped shows.' },
    { status: 405 }
  );
}
