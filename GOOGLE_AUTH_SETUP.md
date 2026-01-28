# Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for Wordly using Supabase.

## Prerequisites

- A Supabase project (you're already using `tiny-life-coach`)
- A Google Cloud account

## Step 1: Configure Google OAuth in Supabase

### 1.1 Go to Supabase Dashboard

1. Open your Supabase project: [tiny-life-coach](https://supabase.com/dashboard/project/imcszsrkfjclekohqebc)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list of providers

### 1.2 Get Callback URL

Copy the **Callback URL** shown in Supabase. It will look like:
```
https://imcszsrkfjclekohqebc.supabase.co/auth/v1/callback
```

## Step 2: Create Google OAuth Credentials

### 2.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**

### 2.2 Configure OAuth Consent Screen

1. Click **OAuth consent screen** in the left sidebar
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Wordly
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. Skip the **Scopes** section (click **Save and Continue**)
6. Add test users if needed (optional for development)
7. Click **Save and Continue**

### 2.3 Create OAuth Client ID

1. Go back to **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Wordly Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - Your production domain (when deployed)
   - **Authorized redirect URIs**:
     - Paste the Supabase callback URL from Step 1.2
     - `http://localhost:3000/auth/callback` (for development)
5. Click **Create**

### 2.4 Copy Credentials

After creation, you'll see:
- **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abc123xyz`)

**Important**: Keep these credentials secure!

## Step 3: Configure Supabase with Google Credentials

1. Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

## Step 4: Update Site URL (Important!)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: Your production domain
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - Your production domain + `/auth/callback`

## Step 5: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected back to the app and logged in!

## Using the Same Supabase Project for Multiple Sites

Yes! You can use the same Supabase project (`tiny-life-coach`) for multiple applications. Here's how:

### Option 1: Same Authentication (Recommended)

If both sites should share users:
1. Both sites use the same Supabase credentials
2. Users can log in to both sites with the same account
3. Add both site URLs to **Redirect URLs** in Supabase

### Option 2: Separate Authentication

If you want separate user bases:
1. Create a new Supabase project for the second site
2. Configure Google OAuth separately for each project

### For Wordly + Your Other Site

Since you're using `tiny-life-coach` for Wordly, you can:
1. Add your other site's URLs to the **Redirect URLs** in Supabase
2. Add your other site's domain to Google OAuth **Authorized redirect URIs**
3. Both sites will share the same user database

**Important**: Make sure to add all your domains to:
- Supabase → Authentication → URL Configuration → Redirect URLs
- Google Cloud Console → OAuth Client → Authorized redirect URIs

## Troubleshooting

### "redirect_uri_mismatch" Error

This means the redirect URI doesn't match what's configured in Google Cloud Console.

**Fix**:
1. Check the URL in the error message
2. Add that exact URL to Google Cloud Console → OAuth Client → Authorized redirect URIs
3. Wait a few minutes for changes to propagate

### "Invalid login credentials" Error

**Fix**:
1. Make sure Google provider is enabled in Supabase
2. Verify Client ID and Client Secret are correct
3. Check that Site URL is set correctly in Supabase

### Users Can't Sign In

**Fix**:
1. Check that OAuth consent screen is published (or user is added as test user)
2. Verify redirect URLs are correct in both Supabase and Google Cloud Console
3. Clear browser cookies and try again

## Security Best Practices

1. ✅ Never commit `.env.local` to git (already in `.gitignore`)
2. ✅ Use environment variables for all credentials
3. ✅ Enable Row Level Security (RLS) on all tables (already done)
4. ✅ Keep Google OAuth credentials secure
5. ✅ Regularly review authorized users in Google Cloud Console

## Next Steps

After setting up authentication:
1. Users will be automatically created in Supabase Auth
2. Flashcards will be user-specific (RLS policies are already set up)
3. Quiz results will be saved per user
4. Each user will only see their own data

Enjoy your new authenticated Wordly app! 🎉
