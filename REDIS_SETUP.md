# Redis Integration Setup

This project uses **Upstash Redis** for caching synonym translations to improve performance and reduce API calls.

## Why Redis?

- **Persistent caching**: Synonyms are cached across sessions
- **Reduced API calls**: Fewer requests to API Ninjas Thesaurus API
- **Better performance**: Instant synonym retrieval from cache
- **Serverless**: Upstash Redis works perfectly with Vercel/Next.js

## Setup Instructions

### 1. Create Upstash Redis Database (Free)

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up for a free account
3. Create a new Redis database:
   - Choose a region close to your users
   - Select "Free" plan (10,000 commands/day)
4. Copy the REST API credentials

### 2. Add Environment Variables

Add these to your `.env.local` file:

```env
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 3. Deploy to Vercel

Add the same environment variables in Vercel:
- Go to your project settings
- Navigate to "Environment Variables"
- Add both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Redeploy your application

## How It Works

### Caching Flow

1. **First request**: 
   - Fetch synonyms from API Ninjas
   - Translate each synonym
   - Store result in Redis (24 hour TTL)
   - Return translations

2. **Subsequent requests**:
   - Check Redis cache first
   - If found, return immediately (no API calls!)
   - If not found, fetch and cache

### Cache Keys

Format: `synonyms:{word}_{sourceLang}_{targetLang}`

Example: `synonyms:happy_en_ru`

### Fallback Behavior

If Redis is not configured:
- Application works normally
- Uses in-memory cache (session-only)
- No errors, just logs warnings

## Benefits

- **Cost savings**: Fewer API calls to paid services
- **Speed**: Instant cache hits (~1ms vs ~500ms API call)
- **Reliability**: Reduces dependency on external APIs
- **Scalability**: Handles multiple users efficiently

## Monitoring

Check your Upstash dashboard to see:
- Number of cached keys
- Cache hit rate
- Memory usage
- Request count

## Cache Management

Cache automatically expires after 24 hours. To manually clear cache, you can:
- Delete keys from Upstash dashboard
- Restart the Redis database
- Wait for TTL expiration

## Optional: Local Development

For local development without Redis:
- App works fine without Redis
- Uses in-memory cache
- No setup required
