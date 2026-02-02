import { NextRequest, NextResponse } from 'next/server';

// Function to get examples from Free Dictionary API (for single words)
async function getFreeDictionaryExamples(word: string): Promise<string[]> {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();
    const examples: string[] = [];

    if (Array.isArray(data)) {
      data.forEach((entry: any) => {
        if (entry.meanings) {
          entry.meanings.forEach((meaning: any) => {
            if (meaning.definitions) {
              meaning.definitions.forEach((def: any) => {
                if (def.example) {
                  examples.push(def.example);
                }
              });
            }
          });
        }
      });
    }

    return examples;
  } catch (error) {
    console.error('Free Dictionary API error:', error);
    return [];
  }
}

// Function to get examples from Wordnik API
async function getWordnikExamples(word: string): Promise<string[]> {
  try {
    // Using free API key
    const apiKey = 'a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';
    const url = `https://api.wordnik.com/v4/word.json/${encodeURIComponent(word)}/examples?api_key=${apiKey}&limit=5`;

    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();
    const examples: string[] = [];

    if (data.examples && Array.isArray(data.examples)) {
      data.examples.forEach((example: any) => {
        if (example.text) {
          examples.push(example.text);
        }
      });
    }

    return examples;
  } catch (error) {
    console.error('Wordnik API error:', error);
    return [];
  }
}

// Generate simple examples for common phrasal verbs/phrases as fallback
function generateFallbackExamples(phrase: string): string[] {
  const fallbacks: Record<string, string[]> = {
    'look after': [
      'Can you look after my dog while I\'m away?',
      'She looks after her elderly parents.',
      'The nurse will look after you during your stay.'
    ],
    'look forward': [
      'I look forward to hearing from you.',
      'We are looking forward to the weekend.',
      'She looks forward to meeting new people.'
    ],
    'stand up': [
      'Please stand up when the teacher enters.',
      'He stood up to defend his friend.',
      'The audience stood up and applauded.'
    ],
    'give up': [
      'Don\'t give up on your dreams.',
      'He gave up smoking last year.',
      'She refused to give up despite the challenges.'
    ],
    'take care': [
      'Take care of yourself!',
      'Please take care when crossing the road.',
      'She takes care of the garden every weekend.'
    ],
    'find out': [
      'I need to find out what happened.',
      'We found out the truth eventually.',
      'Did you find out the results?'
    ],
    'come back': [
      'When will you come back?',
      'He came back after five years.',
      'Please come back soon!'
    ],
    'get up': [
      'I get up at 7 AM every day.',
      'She got up early to catch the train.',
      'It\'s time to get up!'
    ],
  };

  const normalized = phrase.toLowerCase().trim();
  return fallbacks[normalized] || [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const normalizedWord = word.trim().toLowerCase();
    const isMultiWord = normalizedWord.includes(' ');
    let examples: string[] = [];

    if (isMultiWord) {
      // For phrases, try fallback first, then try Wordnik with first word
      examples = generateFallbackExamples(normalizedWord);

      if (examples.length === 0) {
        // Try first word from phrase
        const firstWord = normalizedWord.split(/[\s,;]+/)[0];
        examples = await getFreeDictionaryExamples(firstWord);

        if (examples.length === 0) {
          examples = await getWordnikExamples(firstWord);
        }
      }
    } else {
      // For single words, try Free Dictionary first, then Wordnik
      examples = await getFreeDictionaryExamples(normalizedWord);

      if (examples.length === 0) {
        examples = await getWordnikExamples(normalizedWord);
      }
    }

    return NextResponse.json({
      word: normalizedWord,
      originalQuery: word,
      examples: examples.slice(0, 5) // Return max 5 examples
    });
  } catch (error) {
    console.error('Examples API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', examples: [] },
      { status: 500 }
    );
  }
}
