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
 * Check if answer is valid against array of correct answers
 */
export function validateAnswer(
  userAnswer: string, 
  validAnswers: string[]
): {
  isCorrect: boolean;
  similarity: number;
  feedback?: string;
} {
  const normalizedUser = normalizeText(userAnswer);

  // Check exact match with any valid answer
  for (const correctAnswer of validAnswers) {
    const normalizedCorrect = normalizeText(correctAnswer);
    
    if (normalizedUser === normalizedCorrect) {
      return { isCorrect: true, similarity: 100 };
    }
  }

  // Find best similarity match
  let bestSimilarity = 0;
  let bestMatch = '';
  
  for (const correctAnswer of validAnswers) {
    const normalizedCorrect = normalizeText(correctAnswer);
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = normalizedCorrect;
    }
  }

  // Accept if similarity is >= 85% (allows for minor typos and variations)
  if (bestSimilarity >= 85) {
    return { 
      isCorrect: true, 
      similarity: bestSimilarity,
      feedback: bestSimilarity < 100 ? 'Close enough! Minor spelling difference.' : undefined
    };
  }

  // Check if user answer contains any correct answer or vice versa
  for (const correctAnswer of validAnswers) {
    const normalizedCorrect = normalizeText(correctAnswer);
    
    if (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)) {
      const lengthRatio = Math.min(normalizedUser.length, normalizedCorrect.length) / 
                         Math.max(normalizedUser.length, normalizedCorrect.length);
      
      if (lengthRatio >= 0.7) {
        return { 
          isCorrect: true, 
          similarity: bestSimilarity,
          feedback: 'Correct! (Alternative form accepted)'
        };
      }
    }
  }

  // Check if answer matches any synonym (similarity >= 80%)
  if (bestSimilarity >= 80) {
    return { 
      isCorrect: true, 
      similarity: bestSimilarity,
      feedback: 'Correct! (Synonym accepted)'
    };
  }

  // Not correct
  return { isCorrect: false, similarity: bestSimilarity };
}

