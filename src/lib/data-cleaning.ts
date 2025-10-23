/**
 * Data Cleaning & Normalization Utilities
 * Handles normalization of scraped show data
 */

import { normalizeVenueName } from './venue-dedup';

/**
 * Normalizes text by removing extra whitespace, fixing encoding issues
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ') // Non-breaking space to regular space
    .replace(/[\u200b-\u200d\ufeff]/g, ''); // Remove zero-width characters
}

/**
 * Removes duplicate information from name
 * E.g., "Show Name - Show Name - Venue" -> "Show Name"
 */
export function removeDuplicateNameParts(text: string): string {
  const normalized = normalizeText(text);
  const parts = normalized.split(/\s*[-–|/]\s*/);
  
  if (parts.length <= 1) return normalized;
  
  // Remove exact duplicates and keep first occurrence
  const seen = new Set<string>();
  const unique = parts.filter(part => {
    const lower = part.toLowerCase().trim();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
  
  return unique.join(' - ');
}

/**
 * Extracts artist name from show name
 * Handles patterns like "Artist @ Venue", "Artist - Venue", "Artist en Venue"
 */
export function extractArtistName(text: string): string {
  const normalized = normalizeText(text);
  
  // Common patterns to detect artist name boundaries
  const patterns = [
    /^([^@|/-]+?)(?:\s+@\s+|\s+en\s+|\s+at\s+)/i, // Artist @ Venue or Artist en Venue
    /^([^|/-]+?)(?:\s*[-–]\s*)/i, // Artist - Something
    /^([^/]+?)(?:\s*\/\s*)/i, // Artist / Genre
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return normalizeText(match[1]).trim();
    }
  }
  
  // If no pattern matched, return first meaningful word(s)
  // Usually the first 1-3 words are the artist
  const words = normalized.split(/\s+/);
  let artist = words[0];
  
  // If first word is too short, add more words
  if (artist.length < 3 && words.length > 1) {
    artist = words.slice(0, 2).join(' ');
  }
  
  return artist;
}

/**
 * Cleans venue name by removing suffixes and standardizing
 */
export function cleanVenueName(text: string): string {
  const normalized = normalizeText(text);
  
  // Remove common suffixes
  const cleaned = normalized
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical info
    .replace(/\s*(teatro|club|venue|venue|stadium|arena|coliseum|auditorium|centro|centro cultural|espacio|lugar)\s*$/i, '') // Remove venue type suffix
    .trim();
  
  return cleaned;
}

/**
 * Validates and normalizes a show date
 */
export function normalizeDate(dateInput: string | Date): Date | null {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}

/**
 * Removes redundant information from description
 * Removes text that's already in name, artist, or venue
 */
export function cleanDescription(
  description: string,
  name: string,
  artist: string,
  venue: string
): string {
  let cleaned = normalizeText(description);
  
  // Remove artist name if it appears at the start
  const artistRegex = new RegExp(`^${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–]?\\s*`, 'i');
  cleaned = cleaned.replace(artistRegex, '');
  
  // Remove venue name if it appears
  const venueRegex = new RegExp(`\\b${venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  cleaned = cleaned.replace(venueRegex, '');
  
  // Remove show name if it appears
  const nameRegex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–]?\\s*`, 'i');
  cleaned = cleaned.replace(nameRegex, '');
  
  // Clean up extra separators
  cleaned = cleaned
    .replace(/^\s*[-–|/]\s*/, '') // Remove leading separators
    .replace(/\s*[-–|/]\s*$/, '') // Remove trailing separators
    .replace(/\s*[-–|/]\s*[-–|/]\s*/g, ' - ') // Fix multiple separators
    .trim();
  
  // Don't keep descriptions that are too short or empty
  if (cleaned.length < 5) return '';
  
  return cleaned;
}

/**
 * Validates show data for quality
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateShowData(
  name: string,
  artist: string,
  date: Date,
  venue: string
): ValidationResult {
  const errors: string[] = [];
  
  // Validate name
  if (!name || name.length < 2) {
    errors.push('Show name is too short');
  }
  if (name.length > 255) {
    errors.push('Show name is too long');
  }
  
  // Validate artist
  if (!artist || artist.length < 2) {
    errors.push('Artist name is too short');
  }
  if (artist.length > 255) {
    errors.push('Artist name is too long');
  }
  
  // Validate date
  if (!date || isNaN(date.getTime())) {
    errors.push('Invalid date');
  }
  if (date < new Date()) {
    errors.push('Date is in the past');
  }
  
  // Validate venue
  if (!venue || venue.length < 2) {
    errors.push('Venue name is too short');
  }
  if (venue.length > 255) {
    errors.push('Venue name is too long');
  }
  
  // Check for obviously bad data (name/artist/venue are too similar)
  const lowerName = name.toLowerCase();
  const lowerArtist = artist.toLowerCase();
  const lowerVenue = venue.toLowerCase();
  
  if (lowerName === lowerArtist) {
    errors.push('Show name and artist are identical');
  }
  
  // Check for repeated words across fields (sign of bad parsing)
  const nameWords = new Set(lowerName.split(/\s+/));
  const artistWords = lowerArtist.split(/\s+/);
  const venueWords = lowerVenue.split(/\s+/);
  
  const nameArtistOverlap = artistWords.filter(w => nameWords.has(w)).length;
  if (nameArtistOverlap > 2) {
    errors.push('Excessive overlap between name and artist');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Deduplicates shows by similarity
 * Groups shows that are likely duplicates based on name/date/venue
 */
export function deduplicateShows(
  shows: Array<{
    name: string;
    artist: string;
    date: Date;
    venue: string;
    [key: string]: any;
  }>
): Array<any> {
  const seen = new Map<string, any>();
  
  shows.forEach(show => {
    // Create a normalized key for deduplication
    const key = `${show.name.toLowerCase().trim()}|${show.date.toISOString().split('T')[0]}|${show.venue.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, show);
    }
  });
  
  return Array.from(seen.values());
}

/**
 * Main cleaning function that applies all normalizations
 */
export function cleanShowData(rawData: any) {
  const name = removeDuplicateNameParts(normalizeText(rawData.name || ''));
  const artist = extractArtistName(name);
  const venue = cleanVenueName(normalizeText(rawData.venue || ''));
  const date = normalizeDate(rawData.date);
  const description = cleanDescription(
    normalizeText(rawData.description || ''),
    name,
    artist,
    venue
  );
  
  if (!date) {
    return {
      valid: false,
      errors: ['Invalid date']
    };
  }
  
  const validation = validateShowData(name, artist, date, venue);
  
  return {
    valid: validation.valid,
    errors: validation.errors,
    data: {
      name,
      artist,
      venue,
      date,
      description,
      imageUrl: rawData.imageUrl,
      ticketUrl: rawData.ticketUrl,
      source: rawData.source
    }
  };
}
