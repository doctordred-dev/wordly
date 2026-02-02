import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';

// TODO: Create phrase_examples_cache table in Supabase using supabase_phrase_examples_cache.sql
// Then uncomment the cache functions below

// Check Supabase cache first
async function getCachedExamples(phrase: string): Promise<string[] | null> {
  // Temporarily disabled until table is created
  return null;

  // try {
  //   const { data, error } = await supabase
  //     .from('phrase_examples_cache')
  //     .select('examples')
  //     .eq('phrase', phrase.toLowerCase().trim())
  //     .single();

  //   if (error || !data) return null;

  //   return data.examples as string[];
  // } catch (error) {
  //   console.error('Error getting cached examples:', error);
  //   return null;
  // }
}

// Save examples to Supabase cache
async function cacheExamples(phrase: string, examples: string[], source: string): Promise<void> {
  // Temporarily disabled until table is created
  return;

  // try {
  //   await supabase
  //     .from('phrase_examples_cache')
  //     .upsert({
  //       phrase: phrase.toLowerCase().trim(),
  //       examples,
  //       source,
  //       updated_at: new Date().toISOString()
  //     }, {
  //       onConflict: 'phrase'
  //     });
  // } catch (error) {
  //   console.error('Error caching examples:', error);
  // }
}

// Function to get examples from STANDS4 Phrases API
async function getStands4Examples(phrase: string): Promise<string[]> {
  try {
    const uid = process.env.STANDS4_USER_ID;
    const token = process.env.STANDS4_TOKEN;

    if (!uid || !token) return [];

    const url = new URL('https://www.stands4.com/services/v2/phrases.php');
    url.searchParams.set('uid', uid);
    url.searchParams.set('tokenid', token);
    url.searchParams.set('phrase', phrase);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const examples: string[] = [];

    // Parse STANDS4 response
    // Use examples OR explanations that contain our phrase
    if (data.result) {
      // Handle both array and single object responses
      const results = Array.isArray(data.result) ? data.result : [data.result];

      results.forEach((item: any) => {
        const normalizedPhrase = phrase.toLowerCase().trim();
        const termMatches = item.term && item.term.toLowerCase().trim() === normalizedPhrase;
        const explanationContainsPhrase = item.explanation &&
          item.explanation.toLowerCase().includes(normalizedPhrase);

        // If term matches OR explanation contains our phrase
        if (termMatches || explanationContainsPhrase) {
          // Always use the explanation (it contains our phrase and gives context)
          if (item.explanation && typeof item.explanation === 'string' && item.explanation.trim().length > 0) {
            examples.push(item.explanation);
          }
        }
      });
    }

    return examples;
  } catch (error) {
    console.error('STANDS4 API error:', error);
    return [];
  }
}

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const normalizedWord = word.trim().toLowerCase();

    // Check cache first
    const cachedExamples = await getCachedExamples(normalizedWord);
    if (cachedExamples && cachedExamples.length > 0) {
      return NextResponse.json({
        word: normalizedWord,
        originalQuery: word,
        examples: cachedExamples.slice(0, 3),
        source: 'cache'
      });
    }

    const isMultiWord = normalizedWord.includes(' ');
    let examples: string[] = [];
    let source = 'fallback';

    if (isMultiWord) {
      // For phrases: Try STANDS4 API first, then fallback to Wordnik
      examples = await getStands4Examples(normalizedWord);

      if (examples.length > 0) {
        source = 'stands4';
      } else {
        // Try Wordnik as fallback for phrases
        examples = await getWordnikExamples(normalizedWord);
        if (examples.length > 0) {
          source = 'wordnik';
        }
      }
    } else {
      // For single words: Free Dictionary -> Wordnik
      examples = await getFreeDictionaryExamples(normalizedWord);

      if (examples.length > 0) {
        source = 'free_dictionary';
      } else {
        examples = await getWordnikExamples(normalizedWord);
        if (examples.length > 0) {
          source = 'wordnik';
        }
      }
    }

    // Cache the results for future use
    if (examples.length > 0) {
      await cacheExamples(normalizedWord, examples.slice(0, 3), source);
    }

    return NextResponse.json({
      word: normalizedWord,
      originalQuery: word,
      examples: examples.slice(0, 3),
      source
    });
  } catch (error) {
    console.error('Examples API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', examples: [] },
      { status: 500 }
    );
  }
}
