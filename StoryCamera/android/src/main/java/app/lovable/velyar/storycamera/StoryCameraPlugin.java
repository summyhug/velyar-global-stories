package app.lovable.velyar.storycamera;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "StoryCamera",
    permissions = {
        @Permission(alias = "camera", strings = { android.Manifest.permission.CAMERA }),
        @Permission(alias = "microphone", strings = { android.Manifest.permission.RECORD_AUDIO })
    }
)
public class StoryCameraPlugin extends Plugin {
    private static final String TAG = "StoryCameraPlugin";
    private static final int RECORD_VIDEO_REQUEST_CODE = 9901;
    private PluginCall pendingCall = null;

    @PluginMethod
    public void recordVideo(PluginCall call) {
        Log.d(TAG, "recordVideo called");
        
        // Check permissions using standard Android permission checking
        boolean hasCameraPermission = ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean hasMicrophonePermission = ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        
        Log.d(TAG, "Camera permission: " + hasCameraPermission);
        Log.d(TAG, "Microphone permission: " + hasMicrophonePermission);
        
        // Save call for result - use both methods for robustness
        Log.d(TAG, "Saving call for result");
        saveCall(call);
        pendingCall = call;

        // Check permissions
        if (!hasCameraPermission || !hasMicrophonePermission) {
            Log.d(TAG, "Requesting permissions - camera: " + hasCameraPermission + ", microphone: " + hasMicrophonePermission);
            requestAllPermissions(call, "permissionsCallback");
            return;
        }

        Log.d(TAG, "All permissions granted, launching camera activity");
        launchCameraActivity(call);
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        Log.d(TAG, "permissionsCallback called");
        
        // Check permissions using standard Android permission checking
        boolean hasCameraPermission = ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        boolean hasMicrophonePermission = ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        
        Log.d(TAG, "Camera permission after request: " + hasCameraPermission);
        Log.d(TAG, "Microphone permission after request: " + hasMicrophonePermission);
        
        if (hasCameraPermission && hasMicrophonePermission) {
            Log.d(TAG, "All permissions granted in callback, launching camera activity");
            launchCameraActivity(call);
        } else {
            Log.d(TAG, "Permissions not granted in callback");
            if (call != null) {
                call.reject("Camera or microphone permission not granted. Please grant permissions in Settings.");
            }
        }
    }

    private void launchCameraActivity(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), StoryCameraActivity.class);
            startActivityForResult(call, intent, RECORD_VIDEO_REQUEST_CODE);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start StoryCameraActivity", e);
            if (call != null) {
                call.reject("Failed to start camera activity: " + e.getMessage());
            }
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "handleOnActivityResult called - requestCode: " + requestCode + ", resultCode: " + resultCode);
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode != RECORD_VIDEO_REQUEST_CODE) {
            Log.d(TAG, "Request code mismatch, ignoring");
            return;
        }

        // Try to get the call from both sources
        PluginCall savedCall = getSavedCall();
        if (savedCall == null && pendingCall != null) {
            Log.d(TAG, "Using pending call as fallback");
            savedCall = pendingCall;
        }
        
        Log.d(TAG, "Saved call: " + (savedCall != null ? "found" : "null"));
        
        if (savedCall == null) {
            Log.w(TAG, "No saved call to resolve");
            return;
        }

        if (resultCode == Activity.RESULT_OK && data != null && data.hasExtra("videoUri")) {
            String videoUri = data.getStringExtra("videoUri");
            Log.d(TAG, "Recording successful, videoUri: " + videoUri);
            JSObject ret = new JSObject();
            ret.put("filePath", videoUri);
            savedCall.resolve(ret);
        } else if (resultCode == Activity.RESULT_CANCELED) {
            Log.d(TAG, "Recording cancelled");
            savedCall.reject("Recording cancelled");
        } else {
            Log.d(TAG, "Recording failed");
            savedCall.reject("Recording failed");
        }
        
        Log.d(TAG, "Releasing call");
        bridge.releaseCall(savedCall);
        pendingCall = null; // Clear the pending call
    }
}

