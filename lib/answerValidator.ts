/**
 * Flexible answer validation for quiz
 * Accepts synonyms, alternative translations, and similar answers
 */

import * as fuzz from 'fuzzball';

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
 * Calculate similarity percentage between two strings using fuzzy matching
 * Uses fuzzball library for better accuracy
 */
function calculateSimilarity(str1: string, str2: string): number {
  // fuzz.ratio returns 0-100
  return fuzz.ratio(str1, str2);
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

  // Accept if similarity is >= 90% (very close match with fuzzy matching)
  if (bestSimilarity >= 90) {
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

  // Accept if similarity is >= 85% (good match, likely a synonym or typo)
  if (bestSimilarity >= 85) {
    return { 
      isCorrect: true, 
      similarity: bestSimilarity,
      feedback: 'Correct! (Synonym accepted)'
    };
  }

  // Not correct
  return { isCorrect: false, similarity: bestSimilarity };
}

