# Route Testing Guide

## Available Routes to Test:

### Public Routes (no login needed):
- `/auth` - Login/Signup page
- `/privacy` - Privacy policy
- `/terms` - Terms of service

### Protected Routes (login required):
- `/` - Home page
- `/explore` - Explore page
- `/missions` - Missions page
- `/create` - Video create page
- `/profile` - Profile page
- `/general-settings` - Settings page
- **`/admin/upload`** - Admin video upload (NEW - for fake user)

### Admin Routes (sumit@velyar.com only):
- `/admin/missions` - Admin missions management
- `/admin/prompts` - Admin prompts management
- `/admin/videos` - Admin videos management

## How to Test:

1. **Make sure you're logged in** as yun@velyar.com
2. Try these URLs in your browser:
   - `http://localhost:5173/admin/upload` (if using Vite dev server)
   - Or your production URL: `https://your-domain.com/admin/upload`

3. **Check browser console** for any errors:
   - Open DevTools (F12)
   - Look for route errors or component errors

4. **If /admin/upload doesn't work**, try:
   - Check if you're logged in (should redirect to /auth if not)
   - Check browser console for errors
   - Try navigating via code: `window.location.href = '/admin/upload'`

## Quick Test:

Open browser console and run:
```javascript
// Navigate to upload page
window.location.href = '/admin/upload';
```

Or create a temporary link on any page:
```javascript
// In browser console
const link = document.createElement('a');
link.href = '/admin/upload';
link.textContent = 'Go to Upload';
document.body.appendChild(link);
link.click();
```

