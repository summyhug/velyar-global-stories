# Supabase Configuration for Vercel Deployment

## ✅ Good News: CORS is Automatic

Supabase's REST API automatically allows requests from any origin, so you **don't need to configure CORS manually**. This is likely not the issue.

## 🔍 Finding Your Supabase Settings

### Step 1: Navigate to Settings
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Settings"** in the left sidebar (gear icon)
4. You should see tabs like: **General**, **API**, **Authentication**, **Database**, etc.

### Step 2: Check API Settings
1. Click the **"API"** tab under Settings
2. Here you'll see:
   - **Project URL**: Should be `https://wgnjrvgjfoumqnlxzmgo.supabase.co`
   - **anon public key**: Should match what's in your code
   - **service_role key**: (keep this secret!)

### Step 3: Check Authentication Settings (IMPORTANT)
1. Click the **"Authentication"** tab under Settings
2. Scroll down to find:
   - **Site URL**: Update this to `https://velyar.vercel.app`
   - **Redirect URLs**: Add your Vercel domain here:
     ```
     https://velyar.vercel.app/**
     https://velyar.vercel.app/*
     ```

## 🔧 If You Can't Find Settings

### Alternative: Check Your Supabase Project
1. Make sure you're logged into the correct Supabase account
2. Verify you have admin/owner access to the project
3. The project reference ID should be: `wgnjrvgjfoumqnlxzmgo`

### If Settings Menu is Missing
- You might need to upgrade your plan (some settings are plan-specific)
- Or you might not have the right permissions
- Try accessing: `https://supabase.com/dashboard/project/wgnjrvgjfoumqnlxzmgo/settings/api`

## 🐛 Troubleshooting the Connection Issue

Since CORS is automatic, the issue might be:

### 1. **Authentication Redirect URLs**
- Make sure `https://velyar.vercel.app` is in the Redirect URLs list
- This is in Settings → Authentication → Redirect URLs

### 2. **Check Browser Console**
Open your deployed app at `https://velyar.vercel.app` and:
- Press F12 to open DevTools
- Go to Console tab
- Look for any error messages
- Share those errors with me

### 3. **Check Network Tab**
- In DevTools, go to Network tab
- Try to sign in or load data
- Look for failed requests (red)
- Check the error message and status code

### 4. **Verify Supabase Project is Active**
- Make sure your Supabase project isn't paused
- Check that you can access it from the dashboard

## 📝 What to Share

If it's still not working, please share:
1. Any error messages from the browser console
2. Any failed network requests (from Network tab)
3. Screenshots of what you see in Supabase Settings (if possible)

