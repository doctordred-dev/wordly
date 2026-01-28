/**
 * Synonym fetching and caching for better answer validation
 * Uses Redis for persistent caching across sessions
 */

import { translateText } from './translate';
import { getCache, setCache, isRedisAvailable } from './redis';

// In-memory cache for synonyms (fallback if Redis unavailable)
const synonymCache = new Map<string, string[]>();

/**
 * Get synonyms for an English word using Thesaurus API (API Ninjas)
 */
async function fetchEnglishSynonyms(word: string): Promise<string[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NINJAS_API_KEY;
    
    if (!apiKey) {
      console.warn('API Ninjas key not found (NEXT_PUBLIC_NINJAS_API_KEY), skipping synonym fetch');
      return [];
    }

    console.log('Fetching synonyms for:', word);

    // Using API Ninjas Thesaurus API
    const response = await fetch(
      `https://api.api-ninjas.com/v1/thesaurus?word=${encodeURIComponent(word)}`,
      {
        headers: {
          'X-Api-Key': apiKey,
        },
      }
    );
    
    if (!response.ok) {
      console.error('API Ninjas error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('Synonyms received:', data);
    
    // API Ninjas returns { word: "happy", synonyms: ["joyful", "cheerful", ...] }
    const synonyms = data.synonyms || [];
    
    // Filter and limit synonyms
    const filtered = synonyms
      .filter((w: string) => w && w.toLowerCase() !== word.toLowerCase())
      .slice(0, 10); // Limit to 10 synonyms
    
    console.log('Filtered synonyms:', filtered);
    return filtered;
  } catch (error) {
    console.error('Error fetching synonyms:', error);
    return [];
  }
}

/**
 * Get all valid translations for a word (original + synonyms translated)
 */
export async function getAllValidTranslations(
  sourceWord: string,
  originalTranslation: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<string[]> {
  console.log('🔍 getAllValidTranslations called:', { sourceWord, originalTranslation, sourceLang, targetLang });
  
  const cacheKey = `synonyms:${sourceWord}_${sourceLang}_${targetLang}`;
  
  // Try Redis cache first
  if (isRedisAvailable()) {
    const cached = await getCache<string[]>(cacheKey);
    if (cached) {
      console.log('✅ Using Redis cached synonyms for:', sourceWord);
      return cached;
    }
  }
  
  // Fallback to in-memory cache
  if (synonymCache.has(cacheKey)) {
    console.log('✅ Using in-memory cached synonyms for:', sourceWord);
    return synonymCache.get(cacheKey)!;
  }

  const validTranslations = new Set<string>();
  
  // Add original translation
  validTranslations.add(originalTranslation.toLowerCase().trim());
  console.log('📝 Original translation added:', originalTranslation);

  // Only fetch synonyms for English source words
  if (sourceLang === 'en') {
    console.log('🌍 Source language is English, fetching synonyms...');
    try {
      // Get English synonyms
      const synonyms = await fetchEnglishSynonyms(sourceWord);
      console.log('📚 Synonyms fetched:', synonyms);
      
      if (synonyms.length > 0) {
        console.log('🔄 Translating', synonyms.length, 'synonyms...');
        
        // Translate each synonym and check relevance
        const translationResults = await Promise.all(
          synonyms.map(async (synonym) => {
            try {
              const translation = await translateText(synonym, sourceLang, targetLang);
              console.log(`  ✓ ${synonym} → ${translation}`);
              return { synonym, translation: translation.toLowerCase().trim() };
            } catch (error) {
              console.log(`  ✗ ${synonym} → failed`);
              return null;
            }
          })
        );
        
        // Filter out failed translations
        const successfulTranslations = translationResults.filter(r => r !== null) as Array<{synonym: string, translation: string}>;
        
        // Import fuzzball for similarity check
        const fuzz = await import('fuzzball');
        const originalLower = originalTranslation.toLowerCase().trim();
        
        console.log('🎯 Filtering by relevance to original:', originalLower);
        
        // Only keep translations that are somewhat similar to original (>= 50% similarity)
        // or are common alternative translations
        successfulTranslations.forEach(({ synonym, translation }) => {
          const similarity = fuzz.ratio(translation, originalLower);
          
          if (similarity >= 50 || translation.includes(originalLower) || originalLower.includes(translation)) {
            console.log(`  ✅ ${synonym} → ${translation} (similarity: ${similarity}%)`);
            validTranslations.add(translation);
          } else {
            console.log(`  ❌ ${synonym} → ${translation} (similarity: ${similarity}% - too different, skipped)`);
          }
        });
      } else {
        console.log('⚠️ No synonyms found for:', sourceWord);
      }
    } catch (error) {
      console.error('❌ Error getting synonyms:', error);
    }
  } else {
    console.log('⏭️ Skipping synonyms (not English):', sourceLang);
  }

  const result = Array.from(validTranslations);
  
  console.log('✅ Final valid translations:', result);
  
  // Cache the result in memory
  synonymCache.set(cacheKey, result);
  
  // Cache in Redis (24 hour TTL)
  if (isRedisAvailable()) {
    await setCache(cacheKey, result, 86400);
    console.log('💾 Saved to Redis cache:', cacheKey);
  }
  
  return result;
}

/**
 * Clear synonym cache (useful for testing)
 */
export function clearSynonymCache() {
  synonymCache.clear();
}
