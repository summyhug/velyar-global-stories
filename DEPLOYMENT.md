# Velyar App Deployment Guide

This guide covers how to manage versions and deploy the Velyar app to both Android and iOS platforms.

## 📱 Version Management

### Version Number Locations

The app version is managed in multiple locations that need to be kept in sync:

#### 1. **Main App Version** - `package.json`
```json
{
  "version": "1.4.0"
}
```

#### 2. **Android Version** - `android/app/build.gradle`
```gradle
defaultConfig {
    versionCode 10        // Increment for each release
    versionName "1.4"    // Should match package.json major.minor
}
```

#### 3. **iOS Version** - `ios/App/App.xcodeproj/project.pbxproj`
```
MARKETING_VERSION = 1.0;           // Should match package.json major.minor
CURRENT_PROJECT_VERSION = 1;       // Increment for each release
```

#### 4. **StoryCamera Plugin** - `StoryCamera/plugin.json`
```json
{
  "version": "1.0.0"
}
```

### Version Update Checklist

When releasing a new version, update these files in order:

1. ✅ Update `package.json` version (e.g., "1.4.0" → "1.5.0")
2. ✅ Update `android/app/build.gradle`:
   - Increment `versionCode` (e.g., 6 → 7)
   - Update `versionName` to match package.json (e.g., "1.4" → "1.5")
3. ✅ Update `ios/App/App.xcodeproj/project.pbxproj`:
   - Update `MARKETING_VERSION` to match package.json major.minor
   - Increment `CURRENT_PROJECT_VERSION`
4. ✅ Update `StoryCamera/plugin.json` if plugin changes were made

## 🚀 Deployment Process

### Prerequisites

- Node.js (v18+)
- Android Studio with SDK
- Xcode (for iOS builds)
- Capacitor CLI: `npm install -g @capacitor/cli`

### 1. Web Build

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Sync with native platforms
npx cap sync
```

### 2. Android Deployment

#### Development Build
```bash
# Open in Android Studio
npx cap open android

# Or build directly
cd android
./gradlew assembleDebug
```

#### Release Build
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Or build AAB (recommended for Play Store)
./gradlew bundleRelease
```

**Release files location:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

#### Testing on Device
```bash
# Install on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Or run directly
npx cap run android
```

### 3. iOS Deployment

#### Development Build
```bash
# Open in Xcode
npx cap open ios

# Or build directly
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

#### Release Build
1. Open project in Xcode: `npx cap open ios`
2. Select "App" scheme
3. Set configuration to "Release"
4. Build and archive: Product → Archive
5. Distribute via App Store Connect

#### Testing on Device
```bash
# Run on connected device
npx cap run ios

# Or build and install via Xcode
```

### 4. StoryCamera Plugin Updates

If you modify the StoryCamera plugin:

```bash
# Build the plugin
cd StoryCamera
npm run build

# Sync changes to main project
cd ..
npx cap sync
```

## 🔧 Build Configuration

### Android Signing

Release builds are signed with the keystore at `android/velyar-release-key.keystore`:
- **Key Alias**: `velyar-key-alias`
- **Store File**: `velyar-release-key.keystore`

**Important**: Keep the keystore file secure and backed up. Losing it will prevent app updates.

### iOS Configuration

- **Bundle ID**: `com.velyar.app`
- **Minimum iOS Version**: 14.0
- **Target Devices**: iPhone, iPad

### Environment Variables

The app uses different configurations for development and production:

```bash
# Development build
npm run build:dev

# Production build
npm run build
```

## 📦 Release Checklist

### Before Release
- [ ] Update all version numbers (see Version Management section)
- [ ] Test on both Android and iOS devices
- [ ] Verify all features work correctly
- [ ] Check app store guidelines compliance
- [ ] Update release notes

### Android Release
- [ ] Build release AAB: `./gradlew bundleRelease`
- [ ] Upload to Google Play Console
- [ ] Complete store listing information
- [ ] Submit for review

### iOS Release
- [ ] Archive build in Xcode
- [ ] Upload to App Store Connect
- [ ] Complete App Store listing
- [ ] Submit for review

## 🐛 Troubleshooting

### Common Issues

#### Android Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleRelease
```

#### iOS Build Fails
```bash
# Clean derived data
rm -rf ios/DerivedData

# Reinstall pods
cd ios
pod deintegrate
pod install
```

#### Capacitor Sync Issues
```bash
# Force sync
npx cap sync --deployment
```

#### Plugin Issues
```bash
# Rebuild plugin
cd StoryCamera
npm run build
cd ..
npx cap sync
```

### Version Conflicts

If you encounter version conflicts:
1. Check all version numbers are updated consistently
2. Clean build directories: `rm -rf android/build ios/DerivedData`
3. Reinstall dependencies: `npm install`
4. Sync platforms: `npx cap sync`

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/studio/publish)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 🔄 Continuous Integration

For automated deployments, consider setting up CI/CD pipelines that:
1. Automatically increment version numbers
2. Build and test the app
3. Deploy to app stores
4. Generate release notes

Example GitHub Actions workflow structure:
```yaml
- Update versions
- Build web app
- Sync Capacitor
- Build Android AAB
- Build iOS archive
- Deploy to stores
```

---

**Last Updated**: $(date)
**Current Version**: 1.4.0
