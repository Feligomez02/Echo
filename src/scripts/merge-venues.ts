#!/usr/bin/env node

/**
 * Venue Merge Script
 * Usage: npm run merge:venues
 * 
 * This script merges identified duplicate venues into their canonical forms
 */

import { mergeVenueVariations } from '@/lib/venue-dedup';
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('🔧 Venue Merge Script\n');
  console.log('This script will merge duplicate/similar venues into canonical forms.\n');

  try {
    const merges = [
      {
        variations: ['VELVET  CLUB'],
        canonical: 'VELVET CLUB',
        reason: 'Extra space'
      },
      {
        variations: ['Petalos de sol', 'Pétalos de sol'],
        canonical: 'Pétalos de Sol',
        reason: 'Capitalization and accent marks'
      },
      {
        variations: ['Bell Ville, Córdoba. Arg', 'Bell Ville, Córdoba , Arg'],
        canonical: 'Bell Ville, Córdoba',
        reason: 'Inconsistent formatting'
      },
      {
        variations: ['la barra boliche'],
        canonical: 'La Barra Boliche',
        reason: 'Capitalization'
      },
      {
        variations: ['córdoba,córdoba'],
        canonical: 'Córdoba',
        reason: 'Malformed data'
      },
      {
        variations: ['Lima2'],
        canonical: 'Lima2 - Multiespacio',
        reason: 'Shortened name'
      },
      {
        variations: ['ANFI'],
        canonical: 'ANFITEATRO MUNICIPAL DE VILLA MARIA',
        reason: 'Abbreviated name'
      },
    ];

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const merge of merges) {
      console.log(`\n📝 Merging: "${merge.variations.join('", "')}" → "${merge.canonical}"`);
      console.log(`   Reason: ${merge.reason}`);

      const result = await mergeVenueVariations(merge.variations, merge.canonical);
      
      if (result.updated > 0) {
        console.log(`   ✅ Updated ${result.updated} shows`);
        totalUpdated += result.updated;
      }

      if (result.errors.length > 0) {
        console.log(`   ⚠️ Errors:`, result.errors);
        totalErrors += result.errors.length;
      }
    }

    console.log(`\n\n✨ Merge Complete!`);
    console.log(`   Total shows updated: ${totalUpdated}`);
    console.log(`   Total errors: ${totalErrors}`);

    // Get updated statistics
    console.log(`\n📊 Updated Venue Statistics:`);
    const stats = await prisma.show.groupBy({
      by: ['venue'],
      _count: true,
      orderBy: {
        _count: {
          venue: 'desc',
        },
      },
    });

    console.log(`\n   Total unique venues: ${stats.length}\n`);
    
    // Show top venues
    console.log(`   Top 10 venues by show count:`);
    stats.slice(0, 10).forEach((stat: any, index: number) => {
      console.log(`     ${index + 1}. "${stat.venue}" (${stat._count} shows)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().then(() => {
  console.log('\n✅ Done!\n');
  process.exit(0);
});
