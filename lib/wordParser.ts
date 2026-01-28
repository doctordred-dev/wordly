/**
 * Smart word parser that handles multiple input formats:
 * - Newline separated: "word1\nword2\nword3"
 * - Comma separated: "word1, word2, word3"
 * - Space separated: "word1 word2 word3"
 * - Dot separated: "word1. word2. word3"
 * - Mixed formats
 * - Phrases (multiple words): "good morning, how are you"
 */

export function parseWords(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  // First, split by newlines to preserve multi-line input
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const words: string[] = [];

  for (const line of lines) {
    // Check if line contains commas (likely comma-separated)
    if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim()).filter(p => p.length > 0);
      words.push(...parts);
    }
    // Check if line ends with dots (likely dot-separated sentences)
    else if (line.includes('.') && !line.match(/\.\s*$/)) {
      // Split by dots but keep phrases intact
      const parts = line.split(/\.\s+/).map(p => p.trim().replace(/\.$/, '')).filter(p => p.length > 0);
      words.push(...parts);
    }
    // Check if line has multiple words without commas (could be space-separated single words or a phrase)
    else if (line.includes(' ')) {
      // Heuristic: if line has more than 4 words, treat as phrase
      // Otherwise, check if it looks like a list of single words
      const wordCount = line.split(/\s+/).length;
      
      if (wordCount > 4) {
        // Likely a phrase
        words.push(line);
      } else {
        // Check if words are connected (phrase) or separate (list)
        // If all words are short (< 8 chars), likely separate words
        const parts = line.split(/\s+/);
        const avgLength = parts.reduce((sum, w) => sum + w.length, 0) / parts.length;
        
        if (avgLength < 8 && wordCount <= 3) {
          // Likely separate words
          words.push(...parts.map(p => p.trim()).filter(p => p.length > 0));
        } else {
          // Likely a phrase
          words.push(line);
        }
      }
    }
    // Single word or phrase without special delimiters
    else {
      words.push(line);
    }
  }

  // Remove duplicates and clean up
  return Array.from(new Set(words.map(w => w.trim()).filter(w => w.length > 0)));
}

/**
 * Format examples for user guidance
 */
export const INPUT_EXAMPLES = {
  newline: "hello\nworld\ncomputer",
  comma: "hello, world, computer",
  space: "hello world computer",
  dot: "hello. world. computer",
  phrases: "good morning, how are you, thank you very much",
  mixed: "hello, world\ncomputer\ngood morning",
};
