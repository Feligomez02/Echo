/**
 * Venue Normalization & Deduplication
 * Handles cleaning and unifying venue names to prevent duplicates
 */

import { supabase } from './supabase';

/**
 * Common venue name variations and their canonical forms
 */
const VENUE_ALIASES: Record<string, string> = {
  // Chilli Street Club variations
  'chilli street club': 'Chilli Street Club',
  'chilli': 'Chilli Street Club',
  'chilli street': 'Chilli Street Club',
  'csc': 'Chilli Street Club',

  // La Estación variations
  'la estacion': 'La Estación Córdoba',
  'la estacion cordoba': 'La Estación Córdoba',
  'estacion': 'La Estación Córdoba',
  'la estacion outdoor': 'La Estación Córdoba - Outdoor',
  'la estacion indoor': 'La Estación Córdoba - Indoor',

  // Cazona variations
  'cazona': 'Cazona Casa Club',
  'cazona casa club': 'Cazona Casa Club',
  'cazona casa': 'Cazona Casa Club',

  // Lola Cruz Club variations
  'lola cruz': 'Lola Cruz Club',
  'lola cruz club': 'Lola Cruz Club',

  // Canario Disco variations
  'canario disco': 'Canario Disco',
  'canario': 'Canario Disco',

  // Other common venues
  'teatro real': 'Teatro Real',
  'teatro municipal': 'Teatro Municipal',
  'anfiteatro municipal': 'Anfiteatro Municipal',
  'anfiteatro': 'Anfiteatro Municipal',
  'centro cultural': 'Centro Cultural',
  'estancia pizzarro': 'Estancia Pizzarro ex Natal Crespo',
  'estancia': 'Estancia Pizzarro ex Natal Crespo',

  // Online/Virtual venues
  'online': 'Online',
  'streaming': 'Online - Streaming',
  'virtual': 'Online',

  // Generic/Unknown
  'unknown': 'Unknown Venue',
  'tbd': 'To Be Determined',
  'por confirmar': 'To Be Determined',
  'venue desconocido': 'Unknown Venue',
};

/**
 * Normalize venue name and find canonical form
 */
export function normalizeVenueName(venueName: string): string {
  if (!venueName || typeof venueName !== 'string') {
    return 'Unknown Venue';
  }

  const normalized = venueName.trim().toLowerCase().replace(/\s+/g, ' ');

  // Check exact match in aliases
  if (VENUE_ALIASES[normalized]) {
    return VENUE_ALIASES[normalized];
  }

  // Check if any alias is contained in the venue name
  for (const [alias, canonical] of Object.entries(VENUE_ALIASES)) {
    if (normalized.includes(alias) && alias.length > 3) {
      // Prefer longer matches to avoid false positives
      return canonical;
    }
  }

  // If no alias found, return cleaned version with proper capitalization
  return venueName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Find similar venue names in database using string similarity
 * Returns the most similar venue name if similarity is above threshold (0.8)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Levenshtein distance based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(shorter, longer);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate edit distance (Levenshtein distance)
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

/**
 * Get distinct venues from database
 */
export async function getDistinctVenues(): Promise<string[]> {
  const { data: venues, error } = await supabase
    .from('Show')
    .select('venue', { count: 'exact' })
    .limit(1);

  if (error || !venues) {
    return [];
  }

  // Get all unique venues
  const { data: allVenues } = await supabase
    .from('Show')
    .select('venue');

  const uniqueVenues = new Set<string>();
  (allVenues || []).forEach((v: any) => {
    if (v.venue && v.venue.length > 0) {
      uniqueVenues.add(v.venue);
    }
  });

  return Array.from(uniqueVenues).sort();
}

/**
 * Find best matching existing venue in database
 * Returns null if no close match found
 */
export async function findSimilarVenue(
  venueName: string,
  similarityThreshold: number = 0.75
): Promise<string | null> {
  const normalized = normalizeVenueName(venueName);
  const existingVenues = await getDistinctVenues();

  let bestMatch: string | null = null;
  let bestSimilarity = similarityThreshold;

  for (const existingVenue of existingVenues) {
    const normalizedExisting = normalizeVenueName(existingVenue);
    const similarity = calculateStringSimilarity(normalized, normalizedExisting);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = normalizedExisting;
    }
  }

  return bestMatch;
}

/**
 * Get or create normalized venue name
 * If a similar venue exists, returns the existing one
 * Otherwise returns the normalized new name
 */
export async function getOrNormalizeVenue(venueName: string): Promise<string> {
  if (!venueName || venueName.length === 0) {
    return 'Unknown Venue';
  }

  // First try direct normalization (aliases)
  const normalized = normalizeVenueName(venueName);

  // Then try to find similar existing venue in DB
  const similar = await findSimilarVenue(venueName);

  if (similar) {
    console.log(`   🏢 Venue "${venueName}" -> Using existing "${similar}"`);
    return similar;
  }

  console.log(
    `   🏢 Venue "${venueName}" -> Normalized to "${normalized}"`
  );
  return normalized;
}

/**
 * Validate venue name
 */
export function validateVenueName(venue: string): { valid: boolean; error?: string } {
  if (!venue || venue.length === 0) {
    return { valid: false, error: 'Venue name cannot be empty' };
  }

  if (venue.length > 255) {
    return { valid: false, error: 'Venue name is too long' };
  }

  if (venue.length < 2) {
    return { valid: false, error: 'Venue name is too short' };
  }

  return { valid: true };
}

/**
 * Merge all variations of a venue to the canonical form
 * Useful for data cleanup scripts
 */
export async function mergeVenueVariations(
  variations: string[],
  canonicalName: string
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  for (const variation of variations) {
    try {
      const { error } = await supabase
        .from('Show')
        .update({ venue: canonicalName })
        .eq('venue', variation);

      if (error) throw error;
      
      updated++;
      console.log(`   ✓ Merged "${variation}" into "${canonicalName}"`);
    } catch (error) {
      const errorMsg = `Failed to merge "${variation}": ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`   ✗ ${errorMsg}`);
    }
  }

  return { updated, errors };
}

/**
 * Get venue statistics
 */
export async function getVenueStats() {
  const { data: venues, error } = await supabase
    .from('Show')
    .select('venue');

  if (error || !venues) {
    return [];
  }

  const venueCount = new Map<string, number>();
  venues.forEach((v: any) => {
    if (v.venue) {
      venueCount.set(v.venue, (venueCount.get(v.venue) || 0) + 1);
    }
  });

  return Array.from(venueCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      showCount: count,
    }));
}

/**
 * Identify potential venue duplicates
 */
export async function identifyVenueDuplicates(
  similarityThreshold: number = 0.7
): Promise<Map<string, string[]>> {
  const venues = await getDistinctVenues();
  const duplicates = new Map<string, string[]>();

  for (let i = 0; i < venues.length; i++) {
    for (let j = i + 1; j < venues.length; j++) {
      const similarity = calculateStringSimilarity(venues[i], venues[j]);

      if (similarity > similarityThreshold && similarity < 1) {
        const key = venues[i];
        if (!duplicates.has(key)) {
          duplicates.set(key, [venues[i]]);
        }
        duplicates.get(key)!.push(venues[j]);
      }
    }
  }

  return duplicates;
}
