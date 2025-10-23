#!/usr/bin/env node

/**
 * Venue Deduplication & Cleanup Script
 * Usage: npm run clean-venues
 * 
 * This script:
 * 1. Identifies venues with duplicate/similar names
 * 2. Shows statistics about current venues
 * 3. Optionally merges venues to canonical forms
 */

import { 
  getDistinctVenues, 
  identifyVenueDuplicates, 
  getVenueStats, 
  normalizeVenueName,
  mergeVenueVariations,
  calculateStringSimilarity 
} from '@/lib/venue-dedup';
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('🏢 Venue Deduplication & Cleanup Script\n');

  try {
    // Get statistics
    console.log('📊 Venue Statistics:');
    const stats = await getVenueStats();
    
    console.log(`\n📋 Current venues (${stats.length} total):\n`);
    stats.forEach((stat: any, index: number) => {
      console.log(`  ${index + 1}. "${stat.name}" (${stat.showCount} shows)`);
    });

    // Identify duplicates
    console.log('\n\n🔍 Identifying potential duplicates...\n');
    const duplicates = await identifyVenueDuplicates(0.65);

    if (duplicates.size === 0) {
      console.log('✅ No potential duplicates found!');
    } else {
      console.log(`⚠️ Found ${duplicates.size} potential duplicate groups:\n`);
      
      let groupNum = 1;
      for (const [primary, similar] of duplicates) {
        console.log(`  Group ${groupNum}:`);
        console.log(`    Primary:  "${primary}"`);
        similar.slice(1).forEach((v: any) => {
          const similarity = calculateStringSimilarity(primary, v);
          console.log(`    Similar:  "${v}" (${(similarity * 100).toFixed(1)}% match)`);
        });
        console.log('');
        groupNum++;
      }
    }

    // Suggested merges using aliases
    console.log('\n\n📋 Suggested Merges Based on Known Aliases:\n');
    
    const venueAliasMap: Record<string, string[]> = {
      'Chilli Street Club': ['Chilli', 'Chilli Street', 'CSC'],
      'La Estación Córdoba': ['La Estacion', 'Estacion', 'La Estación'],
      'Cazona Casa Club': ['Cazona', 'Cazona Casa'],
      'Lola Cruz Club': ['Lola Cruz'],
      'Canario Disco': ['Canario'],
    };

    let mergeCount = 0;
    for (const [canonical, variations] of Object.entries(venueAliasMap)) {
      // Find which variations actually exist in DB
      const existingVariations = stats
        .map((s: any) => s.name)
        .filter((name: any) => 
          variations.some(v => 
            calculateStringSimilarity(name.toLowerCase(), v.toLowerCase()) > 0.7
          )
        );

      if (existingVariations.length > 0) {
        mergeCount++;
        console.log(`  Merge ${mergeCount}: "${existingVariations.join('", "')}" -> "${canonical}"`);
      }
    }

    if (mergeCount === 0) {
      console.log('  No suggested merges found. Venues are already well-organized!');
    } else {
      console.log(`\n\n💡 To perform these merges, use mergeVenueVariations() function`);
      console.log('   or create a migration script.\n');
    }

    // Manual venue cleanup examples
    console.log('\n📌 Examples for manual cleanup:\n');
    console.log('  // Example 1: Merge "Chilli" variants into "Chilli Street Club"');
    console.log('  await mergeVenueVariations(["Chilli", "Chilli Street"], "Chilli Street Club");\n');
    console.log('  // Example 2: Merge "La Estacion" variants into "La Estación Córdoba"');
    console.log('  await mergeVenueVariations(["La Estacion", "Estacion"], "La Estación Córdoba");\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().then(() => process.exit(0));
