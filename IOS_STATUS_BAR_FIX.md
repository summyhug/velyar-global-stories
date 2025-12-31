# iOS Status Bar Color Fix

## Issue
On iOS in light mode, the status bar text/icons are showing white instead of velyar blue (#285A66).

## Current Implementation
The status bar is set to `Style.Dark` which gives black text/icons. However, iOS only supports:
- `Style.Dark` = Black text/icons (for light backgrounds)
- `Style.Light` = White text/icons (for dark backgrounds)

## Solution Applied
1. **Ensured consistent Dark style** - Updated `IOSStatusBar.tsx` and `useIOSDetection.ts` to consistently use `Style.Dark`
2. **Created native iOS extension** - Added `StatusBarViewController.swift` to override status bar style at the native level

## Files Changed (KEEP THESE when removing screenshot mode)
- `src/components/IOSStatusBar.tsx` - Added comment about velyar blue color
- `src/hooks/useIOSDetection.ts` - Added comment about velyar blue color  
- `ios/App/App/StatusBarViewController.swift` - NEW FILE: Native iOS status bar override

## Note on Custom Colors
iOS doesn't natively support custom status bar text colors. To achieve true velyar blue (#285A66), you would need to:
1. Create a custom status bar overlay view
2. Hide the system status bar
3. Draw custom status bar content with velyar blue color

For now, `Style.Dark` (black) is the closest option to velyar blue and is much better than white.

## Testing
After building, verify:
- Status bar text/icons are dark/black (not white) in light mode
- Status bar background remains #fffbf0 (warm beige)

