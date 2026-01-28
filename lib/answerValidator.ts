/**
 * Flexible answer validation for quiz
 * Accepts synonyms, alternative translations, and similar answers
 */

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(str1, str2);
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Check if two words are synonyms by translating back and forth
 */
async function areSynonyms(word1: string, word2: string, targetLang: string = 'ru', sourceLang: string = 'en'): Promise<boolean> {
  try {
    // Translate word1 back to source language
    const response1 = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${targetLang}&tl=${sourceLang}&dt=t&q=${encodeURIComponent(word1)}`
    );
    
    if (!response1.ok) return false;
    const data1 = await response1.json();
    const backTranslation1 = data1?.[0]?.[0]?.[0]?.toLowerCase().trim();

    // Translate word2 back to source language
    const response2 = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${targetLang}&tl=${sourceLang}&dt=t&q=${encodeURIComponent(word2)}`
    );
    
    if (!response2.ok) return false;
    const data2 = await response2.json();
    const backTranslation2 = data2?.[0]?.[0]?.[0]?.toLowerCase().trim();

    // If both translate to the same source word, they are synonyms
    return backTranslation1 === backTranslation2;
  } catch (error) {
    console.error('Synonym check error:', error);
    return false;
  }
}

/**
 * Check if answer is valid (exact match, synonym, or very similar)
 */
export async function validateAnswer(
  userAnswer: string, 
  correctAnswer: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<{
  isCorrect: boolean;
  similarity: number;
  feedback?: string;
}> {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, similarity: 100 };
  }

  // Calculate similarity
  const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

  // Accept if similarity is >= 85% (allows for minor typos and variations)
  if (similarity >= 85) {
    return { 
      isCorrect: true, 
      similarity,
      feedback: similarity < 100 ? 'Close enough! Minor spelling difference.' : undefined
    };
  }

  // Check if user answer contains the correct answer or vice versa
  // (handles cases like "привет" vs "привет!")
  if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
    const lengthRatio = Math.min(normalizedUser.length, normalizedCorrect.length) / 
                       Math.max(normalizedUser.length, normalizedCorrect.length);
    
    if (lengthRatio >= 0.7) {
      return { 
        isCorrect: true, 
        similarity,
        feedback: 'Correct! (Alternative form accepted)'
      };
    }
  }

  // Check for synonyms using translation API
  // Only check if similarity is reasonably high (>= 60%) to avoid unnecessary API calls
  if (similarity >= 60) {
    const synonymCheck = await areSynonyms(normalizedUser, normalizedCorrect, targetLang, sourceLang);
    if (synonymCheck) {
      return { 
        isCorrect: true, 
        similarity: 90,
        feedback: 'Correct! (Synonym accepted)'
      };
    }
  }

  // Not correct
  return { isCorrect: false, similarity };
}

/**
 * Get multiple acceptable answers by translating back
 * This helps find alternative translations
 */
export async function getAlternativeTranslations(
  word: string,
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  // This could call translation API to get alternatives
  // For now, return just the word
  return [word];
}
