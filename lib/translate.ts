export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ru'
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
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
