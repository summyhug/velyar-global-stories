# Fix Archive Issues - Step by Step Guide

## Problem
Frameworks aren't being built before the embedding script tries to copy them during Archive.

## Solution Steps

### 1. Fix StoryCamera Podspec
The podspec path was incorrect. It's now fixed to point to `ios/StoryCameraPlugin/` instead of `ios/Plugin/`.

### 2. Full Clean and Resync

Run these commands in order:

```bash
# From project root
cd /Users/sumitmehta/Documents/Projects/velyar-global-stories

# Ensure dependencies are up to date
npm install

# Sync Capacitor
npx cap sync ios

# Clean and reinstall pods
cd ios/App
pod deintegrate
rm -rf Pods Podfile.lock
pod repo update
pod install
```

### 3. Clean Derived Data

```bash
# Quit Xcode first, then:
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

### 4. Verify Build Order in Xcode

**Option A: Check Build Action (Recommended)**
1. Open `ios/App/App.xcworkspace` (NOT the .xcodeproj)
   - In Finder: Navigate to `ios/App/` folder and double-click `App.xcworkspace`
   - Or in Terminal: `cd ios/App && open App.xcworkspace`
2. In Xcode menu: **Product > Scheme > Edit Scheme...**
3. In the left sidebar, select **"Build"** (not Archive)
4. You should see targets listed - this is the build order
5. Verify **Pods-App** is listed and checked before **App**

**Option B: Check Dependencies (More reliable)**
1. Select your **App** target in the Project Navigator (left sidebar)
2. Click on **App** target in the middle panel
3. Go to **Build Phases** tab
4. Expand **"Dependencies"** section
5. You should see **Pods-App** listed as a dependency
6. If not, click **+** and add **Pods-App**

**Option C: Verify Pods Target Exists**
1. In Xcode, look at the Project Navigator (left sidebar)
2. You should see a **Pods** project with a **Pods-App** target
3. If you don't see this, run `pod install` again in Terminal

**What to verify:**
- **Pods-App** target exists and is a dependency of **App**
- All pod frameworks are listed in Build Phases > Link Binary With Libraries

### 5. Test Build Pods First

1. Select "Generic iOS Device" (or any connected device)
2. Select "Release" configuration
3. Build the **Pods-App** target first:
   - Product > Scheme > Pods-App
   - Product > Build (Cmd+B)
4. Verify frameworks are built in DerivedData
5. Then build your **App** target

### 6. Archive

1. Product > Scheme > App (switch back to your app)
2. Product > Clean Build Folder (Shift+Cmd+K)
3. Product > Archive

### 7. If Still Failing

Check the Archive log for:
- Which specific framework path is missing (e.g., `.../Capacitor.framework`)
- Any error messages about StoryCamera

Then verify:
- StoryCamera pod builds successfully for Release
- All framework paths in Build Phases > [CP] Embed Pods Frameworks match actual framework locations

