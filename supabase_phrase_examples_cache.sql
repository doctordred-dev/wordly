-- Create table for caching phrase examples
-- This reduces API calls to STANDS4 (100/day limit)

CREATE TABLE IF NOT EXISTS phrase_examples_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phrase TEXT NOT NULL UNIQUE,
  examples JSONB NOT NULL,
  source TEXT NOT NULL, -- 'stands4', 'wordnik', 'free_dictionary', 'fallback'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast phrase lookup
CREATE INDEX IF NOT EXISTS idx_phrase_examples_phrase ON phrase_examples_cache(phrase);

-- Enable Row Level Security
ALTER TABLE phrase_examples_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all users to read cached examples (public data)
CREATE POLICY "Allow public read access to phrase examples cache"
ON phrase_examples_cache
FOR SELECT
USING (true);

-- Policy: Only authenticated users can insert/update cache
CREATE POLICY "Allow authenticated users to manage cache"
ON phrase_examples_cache
FOR ALL
USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE phrase_examples_cache IS 'Cache for phrase examples to reduce external API calls';
