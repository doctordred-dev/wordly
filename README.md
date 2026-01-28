# Wordly - Flashcard Learning App

A Quizlet-like application for learning words with automatic translation.

## Features

- 📝 Bulk word input - paste multiple words at once
- 🔄 Automatic translation using MyMemory API (free, no API key required)
- 🎴 Flashcards with flip animation
- 💾 Supabase database for storing flashcards
- 🎨 Modern UI with TailwindCSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create `.env.local` file with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses a `flashcards` table with the following structure:
- `id` (uuid, primary key)
- `word` (text) - original word
- `translation` (text) - translated word
- `source_lang` (text) - source language code (e.g., 'en')
- `target_lang` (text) - target language code (e.g., 'ru')
- `created_at` (timestamp)

## Translation API

Uses MyMemory Translation API (free tier):
- 1000 requests/day
- No API key required
- Supports multiple languages
