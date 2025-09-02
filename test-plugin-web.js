// Simple test script for StoryCamera plugin
// Run this in the browser console at http://localhost:8080/test/story-camera

console.log('🧪 Testing StoryCamera plugin...');

// Test 1: Check if plugin is available
console.log('Plugin object:', StoryCamera);
console.log('Plugin type:', typeof StoryCamera);
console.log('Plugin methods:', Object.getOwnPropertyNames(StoryCamera));

// Test 2: Try to ping the plugin
async function testPing() {
  try {
    console.log('🏓 Testing ping...');
    if (StoryCamera.ping) {
      await StoryCamera.ping();
      console.log('✅ Ping successful!');
    } else {
      console.log('❌ Ping method not available');
    }
  } catch (error) {
    console.error('❌ Ping failed:', error);
  }
}

// Test 3: Try to record video
async function testRecordVideo() {
  try {
    console.log('🎥 Testing recordVideo...');
    const result = await StoryCamera.recordVideo({
      duration: 5,
      camera: 'rear',
      allowOverlays: false
    });
    console.log('✅ Record video successful:', result);
  } catch (error) {
    console.error('❌ Record video failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting plugin tests...');
  
  await testPing();
  await testRecordVideo();
  
  console.log('🏁 Tests completed!');
}

// Run tests when this script is loaded
runTests();

