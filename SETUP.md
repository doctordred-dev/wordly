# Setup Instructions

## 1. Install Dependencies

```bash
npm install
```

## 2. Set up Supabase

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details:
   - Name: wordly (or any name you prefer)
   - Database Password: (create a strong password)
   - Region: Choose closest to you
5. Wait for the project to be created (1-2 minutes)

### Get Your API Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### Create Environment File
1. Create a file named `.env.local` in the project root
2. Add your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Create Database Table
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase-migration.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the query
6. You should see "Success. No rows returned" message

## 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. How to Use

1. **Select Languages**: Choose source and target languages (default: English → Russian)
2. **Enter Words**: Type or paste words, one per line in the textarea
3. **Create Flashcards**: Click "Create Flashcards" button
4. **View Flashcards**: Your flashcards will appear below
5. **Flip Cards**: Click on any card to see the translation
6. **Delete Cards**: Hover over a card and click the × button to delete

## Translation API

The app uses **MyMemory Translation API**:
- ✅ Free to use
- ✅ No API key required
- ✅ 1000 requests per day
- ✅ Supports multiple languages

## Troubleshooting

### "Cannot connect to Supabase"
- Check that `.env.local` file exists and has correct credentials
- Verify the URL and key are copied correctly (no extra spaces)
- Restart the dev server after creating `.env.local`

### "Translation failed"
- Check your internet connection
- You may have hit the daily limit (1000 requests/day)
- Try again in a few seconds (API has rate limiting)

### TypeScript errors in IDE
- Run `npm install` to install all dependencies
- These errors will disappear once dependencies are installed
