/**
 * Quick test integration for StoryCamera plugin
 * Copy and paste this into any existing page for testing
 */

// Quick test function - paste this into any component
const quickTestStoryCamera = async () => {
  try {
    console.log('🧪 Starting StoryCamera quick test...');
    
    // Import the plugin (adjust path as needed)
    const StoryCamera = await import('./index').then(m => m.default);
    
    // Test basic recording
    console.log('📹 Testing basic recording...');
    const result = await StoryCamera.recordVideo({
      duration: 10, // Short test duration
      camera: 'rear',
      allowOverlays: true
    });
    
    console.log('✅ Recording successful!', result);
    
    // Display results in a simple alert
    alert(`Recording successful!\n\nDuration: ${result.duration}s\nSize: ${(result.size / 1024 / 1024).toFixed(2)}MB\nCamera: ${result.camera}\nOverlays: ${result.overlays.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Recording failed:', error);
    alert(`Recording failed: ${error.message}`);
    throw error;
  }
};

// Add this button to any component for testing
const StoryCameraTestButton = () => {
  return (
    <button
      onClick={quickTestStoryCamera}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        fontSize: '14px'
      }}
    >
      🎥 Test StoryCamera
    </button>
  );
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quickTestStoryCamera, StoryCameraTestButton };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.quickTestStoryCamera = quickTestStoryCamera;
  window.StoryCameraTestButton = StoryCameraTestButton;
  console.log('🎥 StoryCamera quick test loaded!');
  console.log('Run quickTestStoryCamera() to test the plugin');
}
