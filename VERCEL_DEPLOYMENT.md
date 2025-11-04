# Vercel Deployment Guide

## ✅ What's Already Configured

- `vercel.json` - Build and routing configuration
- `.vercelignore` - Excludes unnecessary files from deployment
- Supabase client is configured with credentials

## 🔧 Required Supabase Configuration

After deploying to Vercel, you **must** update your Supabase project settings:

### 1. Add Allowed Origins (CORS)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `wgnjrvgjfoumqnlxzmgo`
3. Navigate to **Settings** → **API**
4. Scroll to **Allowed Origins (CORS)**
5. Add your Vercel domain:
   - `https://velyar.vercel.app`
   - `https://velyar-global-stories.vercel.app` (if you have a preview URL)
   - Add your custom domain if you set one up

### 2. Update Site URL

1. In Supabase Dashboard, go to **Settings** → **Authentication**
2. Scroll to **Site URL**
3. Update it to: `https://velyar.vercel.app`
   - (Or your custom domain if configured)

### 3. Update Redirect URLs (For OAuth/Email)

1. In **Settings** → **Authentication**
2. Scroll to **Redirect URLs**
3. Add:
   - `https://velyar.vercel.app/**`
   - `https://velyar.vercel.app/*`
   - `https://velyar-global-stories.vercel.app/**` (if you have preview URLs)

### 4. Test the Connection

After updating Supabase settings:
1. Visit `https://velyar.vercel.app`
2. Try to sign in or sign up
3. Check browser console for any CORS errors
4. Verify that data loads correctly

## 🔍 Troubleshooting

### Issue: "CORS policy" errors in console
**Solution**: Make sure you added `https://velyar.vercel.app` to Supabase Allowed Origins

### Issue: Auth redirects not working
**Solution**: Add the domain to Supabase Redirect URLs list

### Issue: Can't fetch data from Supabase
**Solution**: 
1. Check browser console for specific error messages
2. Verify Supabase project is active and not paused
3. Check that your Supabase credentials are correct in `src/integrations/supabase/client.ts`

### Issue: Build succeeds but app doesn't load
**Solution**: 
1. Check Vercel deployment logs
2. Verify `vercel.json` configuration is correct
3. Check that `dist` folder is being generated correctly

## 📝 Environment Variables (Optional)

If you want to use environment variables instead of hardcoded values:

1. In Vercel Dashboard → Project Settings → Environment Variables:
   - Add `VITE_SUPABASE_URL` = `https://wgnjrvgjfoumqnlxzmgo.supabase.co`
   - Add `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

2. Update `src/integrations/supabase/client.ts` to use:
   ```typescript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

**Note**: The current hardcoded approach works fine for client-side apps since the anon key is safe to expose.

