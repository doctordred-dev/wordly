export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<string> {
  try {
    // Try LibreTranslate first (better quality)
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (libreError) {
      console.log('LibreTranslate failed, trying MyMemory:', libreError);
    }

    // Fallback to MyMemory
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      const translated = data.responseData.translatedText;
      
      // Check if translation is same as original (bad translation)
      if (translated.toLowerCase() === text.toLowerCase()) {
        // Try to get better match from matches array
        if (data.matches && data.matches.length > 0) {
          const bestMatch = data.matches.find((m: any) => 
            m.translation && 
            m.translation.toLowerCase() !== text.toLowerCase() &&
            m.match > 0.8
          );
          if (bestMatch) {
            return bestMatch.translation;
          }
        }
      }
      
      return translated;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export async function translateBulk(
  words: string[],
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<Array<{ word: string; translation: string }>> {
  const results = [];
  
  for (const word of words) {
    try {
      const translation = await translateText(word.trim(), sourceLang, targetLang);
      results.push({ word: word.trim(), translation });
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to translate "${word}":`, error);
      results.push({ word: word.trim(), translation: word.trim() });
    }
  }
  
  return results;
}
