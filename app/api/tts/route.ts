import { NextRequest, NextResponse } from 'next/server';

// Map language codes to ElevenLabs voice IDs
// Using default multilingual voices that support multiple languages
const LANGUAGE_VOICES: Record<string, string> = {
  en: '21m00Tcm4TlvDq8ikWAM', // Rachel - English
  uk: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Ukrainian
  ru: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Russian
  de: 'pNInz6obpgDQGcFmaJgB', // Adam - supports German
  fr: 'pNInz6obpgDQGcFmaJgB', // Adam - supports French
  es: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Spanish
  it: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Italian
  pt: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Portuguese
  pl: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Polish
  ja: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Japanese
  zh: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Chinese
  ko: 'pNInz6obpgDQGcFmaJgB', // Adam - supports Korean
};

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'en' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get voice ID for the specified language, fallback to English
    const voiceId = LANGUAGE_VOICES[language] || LANGUAGE_VOICES.en;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
