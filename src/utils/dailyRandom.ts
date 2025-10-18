/**
 * Daily Random Utility
 * 
 * Provides consistent random ordering based on the current date.
 * Same date = same random order throughout the day.
 * Different date = different random order.
 * 
 * This allows for "random" but predictable rotation of messages
 * that stay consistent within a 24-hour period.
 */

/**
 * Simple seeded random number generator
 * Uses mulberry32 algorithm for consistency
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get today's date as a numeric seed (YYYYMMDD format)
 * Example: October 12, 2025 -> 20251012
 */
export function getTodaysSeed(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}

/**
 * Shuffle an array using Fisher-Yates algorithm with a seeded random
 * Returns a new shuffled array without modifying the original
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const rng = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Get a consistent random index based on today's date and time slot
 * 
 * @param arrayLength - Length of the array to pick from
 * @param slotIndex - Time slot index (e.g., 0 for 9:00-9:30, 1 for 9:30-10:00)
 * @returns Index to use for the array
 */
export function getDailyRandomIndex(arrayLength: number, slotIndex: number): number {
  const todaysSeed = getTodaysSeed();
  
  // Create indices array
  const indices = Array.from({ length: arrayLength }, (_, i) => i);
  
  // Shuffle based on today's seed
  const shuffledIndices = shuffleWithSeed(indices, todaysSeed);
  
  // Return the index for this time slot (with wrapping)
  return shuffledIndices[slotIndex % arrayLength];
}

/**
 * Get a single random item from array based on today's seed
 * Useful for login page where we just need one random message per day
 */
export function getDailyRandomItem<T>(array: T[]): T {
  const seed = getTodaysSeed();
  const shuffled = shuffleWithSeed(array, seed);
  return shuffled[0];
}
