# StoryCamera Plugin Testing Guide

## 🧪 Safe Testing Strategies

This guide shows you how to test the StoryCamera plugin without making huge changes to your main app.

## 📋 **Option 1: Quick Test Component (Recommended)**

### Step 1: Add the Test Component
```typescript
// In any existing page, temporarily add:
import { StoryCameraTest } from '../components/StoryCameraTest';

// Add this to your JSX:
<StoryCameraTest />
```

### Step 2: Test the Plugin
1. Navigate to the page with the test component
2. Try different recording options
3. Check console logs for detailed information
4. Verify the returned data structure

### Step 3: Remove When Done
```typescript
// Simply remove the import and component usage
// No other changes needed
```

## 📋 **Option 2: Dedicated Test Page**

### Step 1: Add Temporary Route
```typescript
// In your router configuration, add:
import { StoryCameraTestPage } from './pages/StoryCameraTestPage';

// Add this route temporarily:
{
  path: '/test-story-camera',
  element: <StoryCameraTestPage />
}
```

### Step 2: Access Test Page
- Navigate to `/test-story-camera` in your app
- Test all functionality
- Check results and errors

### Step 3: Remove Route
```typescript
// Remove the import and route when done
```

## 📋 **Option 3: Browser Console Testing**

### Step 1: Load Test Script
```javascript
// In browser console, run:
const script = document.createElement('script');
script.src = '/src/plugins/StoryCamera/test-plugin.js';
document.head.appendChild(script);
```

### Step 2: Run Tests
```javascript
// In console:
testStoryCamera.runAllTests();
```

### Step 3: Test Individual Functions
```javascript
// Test specific functionality:
await testStoryCamera.testBasicRecording();
await testStoryCamera.testCustomOptions();
```

## 📋 **Option 4: Integration with Existing VideoCreate**

### Step 1: Add Plugin Import
```typescript
// In src/pages/VideoCreate.tsx, add:
import StoryCamera from '../plugins/StoryCamera';
```

### Step 2: Add Test Button
```typescript
// Add this button temporarily:
<button
  onClick={async () => {
    try {
      const result = await StoryCamera.recordVideo({
        duration: 15,
        camera: 'front',
        allowOverlays: true
      });
      console.log('StoryCamera result:', result);
      // Handle the result as needed
    } catch (error) {
      console.error('StoryCamera error:', error);
    }
  }}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Test StoryCamera
</button>
```

### Step 3: Remove When Done
```typescript
// Remove the import and button
```

## 🔧 **Testing Checklist**

### ✅ **Basic Functionality**
- [ ] Plugin loads without errors
- [ ] Camera permissions are requested
- [ ] Recording starts and stops
- [ ] Video file is created
- [ ] Thumbnail is generated

### ✅ **Configuration Options**
- [ ] Duration limits work
- [ ] Camera switching works
- [ ] Overlays can be enabled/disabled
- [ ] Different camera positions work

### ✅ **Data Return**
- [ ] File path is returned
- [ ] Thumbnail path is returned
- [ ] Duration is accurate
- [ ] File size is correct
- [ ] Camera used is reported
- [ ] Overlays are tracked

### ✅ **Error Handling**
- [ ] Permission denied is handled
- [ ] Camera not available is handled
- [ ] Recording failures are handled
- [ ] User-friendly error messages

### ✅ **Platform Testing**
- [ ] iOS device testing
- [ ] Android device testing
- [ ] Different screen sizes
- [ ] Different OS versions

## 🚨 **Common Issues & Solutions**

### **Plugin Not Found**
```javascript
// Check if plugin is properly registered
console.log('StoryCamera available:', !!window.StoryCamera);
```

### **Permission Issues**
```javascript
// Check camera permissions
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera access granted'))
  .catch(err => console.log('Camera access denied:', err));
```

### **Build Issues**
```bash
# Rebuild the plugin
cd src/plugins/StoryCamera
npm run build

# Sync with Capacitor
npx cap sync
```

## 📱 **Device Testing**

### **iOS Testing**
1. Open Xcode
2. Build and run on device/simulator
3. Test camera permissions
4. Test recording functionality
5. Check file paths and permissions

### **Android Testing**
1. Open Android Studio
2. Build and run on device/emulator
3. Test camera permissions
4. Test recording functionality
5. Check file storage permissions

## 🧹 **Cleanup After Testing**

### **Remove Test Components**
```typescript
// Remove these files when done:
// - src/components/StoryCameraTest.tsx
// - src/pages/StoryCameraTestPage.tsx
// - src/plugins/StoryCamera/test-plugin.js
```

### **Remove Test Routes**
```typescript
// Remove test routes from router
```

### **Remove Test Imports**
```typescript
// Remove any test-related imports
```

## 📊 **Testing Results Template**

```markdown
## Test Results

### Device Information
- **Platform**: iOS/Android
- **Version**: X.X.X
- **Device**: iPhone/Android Model

### Test Results
- [ ] Basic recording: ✅/❌
- [ ] Custom options: ✅/❌
- [ ] Camera switching: ✅/❌
- [ ] Overlays: ✅/❌
- [ ] Error handling: ✅/❌

### Issues Found
- Issue 1: Description
- Issue 2: Description

### Performance
- Recording start time: X seconds
- File size: X MB
- Processing time: X seconds

### Notes
Additional observations and recommendations
```

## 🎯 **Quick Start Commands**

```bash
# Build the plugin
cd src/plugins/StoryCamera && npm run build

# Sync with Capacitor
npx cap sync

# Run on iOS
npx cap run ios

# Run on Android
npx cap run android

# Test in browser console
# Load test-plugin.js and run testStoryCamera.runAllTests()
```

This approach allows you to thoroughly test the plugin without affecting your main application code!
