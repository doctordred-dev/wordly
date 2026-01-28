export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<string> {
  try {
    // Try Google Translate API (free, no key required)
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Google Translate returns: [[["translated", "original", null, null, 3]]]
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translated = data[0][0][0];
          // Validate translation quality
          if (translated && translated.toLowerCase() !== text.toLowerCase()) {
            return translated;
          }
        }
      }
    } catch (googleError) {
      console.log('Google Translate failed, trying MyMemory:', googleError);
    }

    // Fallback to MyMemory with improved match selection
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200) {
      // First, try to find best match from matches array (more reliable)
      if (data.matches && data.matches.length > 0) {
        // Filter high-quality matches
        const goodMatches = data.matches.filter((m: any) => 
          m.translation && 
          m.translation.trim().length > 0 &&
          m.translation.toLowerCase() !== text.toLowerCase() &&
          m.match >= 0.9 && // High match score
          parseInt(m.quality) >= 70 // Good quality score
        );
        
        if (goodMatches.length > 0) {
          // Sort by quality and match score
          goodMatches.sort((a: any, b: any) => {
            const scoreA = (parseFloat(a.match) * 0.6) + (parseInt(a.quality) / 100 * 0.4);
            const scoreB = (parseFloat(b.match) * 0.6) + (parseInt(b.quality) / 100 * 0.4);
            return scoreB - scoreA;
          });
          
          return goodMatches[0].translation.trim();
        }
      }
      
      // Fallback to responseData if no good matches
      if (data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText.trim();
        
        // Validate it's not the same as input
        if (translated.toLowerCase() !== text.toLowerCase()) {
          return translated;
        }
      }
    }
    
    // Last resort: return original text
    console.warn(`No good translation found for "${text}", returning original`);
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original on error
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
