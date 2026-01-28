/**
 * Synonym fetching and caching for better answer validation
 */

import { translateText } from './translate';

// Cache for synonyms to avoid repeated API calls
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
  // Check cache first
  const cacheKey = `${sourceWord}_${sourceLang}_${targetLang}`;
  if (synonymCache.has(cacheKey)) {
    return synonymCache.get(cacheKey)!;
  }

  const validTranslations = new Set<string>();
  
  // Add original translation
  validTranslations.add(originalTranslation.toLowerCase().trim());

  // Only fetch synonyms for English source words
  if (sourceLang === 'en') {
    try {
      // Get English synonyms
      const synonyms = await fetchEnglishSynonyms(sourceWord);
      
      if (synonyms.length > 0) {
        // Translate each synonym
        const translations = await Promise.all(
          synonyms.map(async (synonym) => {
            try {
              const translation = await translateText(synonym, sourceLang, targetLang);
              return translation.toLowerCase().trim();
            } catch {
              return null;
            }
          })
        );
        
        // Add all successful translations
        translations.forEach(t => {
          if (t && t.length > 0) {
            validTranslations.add(t);
          }
        });
      }
    } catch (error) {
      console.error('Error getting synonyms:', error);
    }
  }

  const result = Array.from(validTranslations);
  
  // Cache the result
  synonymCache.set(cacheKey, result);
  
  return result;
}

/**
 * Clear synonym cache (useful for testing)
 */
export function clearSynonymCache() {
  synonymCache.clear();
}
