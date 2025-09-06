package app.lovable.velyar.storycamera;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.graphics.drawable.GradientDrawable;
import android.animation.ValueAnimator;
import android.animation.ObjectAnimator;
import android.animation.AnimatorSet;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.BounceInterpolator;
import android.view.animation.OvershootInterpolator;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.Build;
import android.content.Context;
import android.widget.RelativeLayout;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.ExecutionException;

public class StoryCameraActivity extends AppCompatActivity {
    private static final String TAG = "StoryCameraActivity";
    private PreviewView previewView;
    private Button recordButton;
    private Button switchCameraButton;
    private Button flashButton;
    private View pulsingRing;
    private ValueAnimator pulseAnimator;
    private boolean isRecording = false;
    private boolean isFlashOn = false;
    private boolean isFrontCamera = false;
    private ProcessCameraProvider cameraProvider;
    private ImageCapture imageCapture;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate - launching StoryCamera activity");
        
        try {
            // Hide action bar for full-screen experience
            if (getSupportActionBar() != null) {
                getSupportActionBar().hide();
            }
            
            setContentView(R.layout.sc_activity_story_camera);
            Log.d(TAG, "Layout set successfully");
            
            previewView = findViewById(R.id.sc_preview_view);
            Log.d(TAG, "PreviewView found: " + (previewView != null));
            
            setupCameraControls();
            Log.d(TAG, "About to start camera");
            startCamera();
            Log.d(TAG, "Camera start initiated");
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            // Return error result
            Intent data = new Intent();
            data.putExtra("error", "Failed to initialize camera: " + e.getMessage());
            setResult(Activity.RESULT_CANCELED, data);
            finish();
        }
    }
    
    private void setupCameraControls() {
        RelativeLayout layout = (RelativeLayout) previewView.getParent();
        
        // Create pulsing ring behind the record button
        pulsingRing = new View(this);
        GradientDrawable ringDrawable = new GradientDrawable();
        ringDrawable.setShape(GradientDrawable.OVAL);
        ringDrawable.setColor(0x00FF7F5A); // Transparent initially
        ringDrawable.setStroke(8, 0xFFFF7F5A); // Octo accent ring
        pulsingRing.setBackground(ringDrawable);
        
        RelativeLayout.LayoutParams ringParams = new RelativeLayout.LayoutParams(160, 160);
        ringParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        ringParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        ringParams.bottomMargin = 100; // Positioned behind the button
        layout.addView(pulsingRing, ringParams);
        
        // Create modern circular record button with Octo accent color (MUCH LARGER)
        recordButton = new Button(this);
        recordButton.setText("●");
        recordButton.setTextSize(48); // Much larger text
        recordButton.setTextColor(0xFFFFFFFF);
        recordButton.setWidth(120); // Much larger button
        recordButton.setHeight(120);
        recordButton.setPadding(0, 0, 0, 0);
        
        // Create circular background with Octo accent border
        GradientDrawable circularDrawable = new GradientDrawable();
        circularDrawable.setShape(GradientDrawable.OVAL);
        circularDrawable.setColor(0xFFFFFFFF); // White background
        circularDrawable.setStroke(8, 0xFFFF7F5A); // Thicker Octo accent border
        recordButton.setBackground(circularDrawable);
        
        RelativeLayout.LayoutParams recordParams = new RelativeLayout.LayoutParams(120, 120);
        recordParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        recordParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        recordParams.bottomMargin = 120; // More space from bottom for safe area
        layout.addView(recordButton, recordParams);
        
        // Create modern switch camera button (top right)
        switchCameraButton = new Button(this);
        switchCameraButton.setText("↻"); // Better camera switch icon
        switchCameraButton.setTextSize(24);
        switchCameraButton.setBackgroundColor(0xCC000000); // More opaque black
        switchCameraButton.setTextColor(0xFFFFFFFF);
        switchCameraButton.setWidth(60);
        switchCameraButton.setHeight(60);
        switchCameraButton.setPadding(0, 0, 0, 0);
        
        RelativeLayout.LayoutParams switchParams = new RelativeLayout.LayoutParams(60, 60);
        switchParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        switchParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        switchParams.topMargin = 120; // More space from top for safe area
        switchParams.rightMargin = 20;
        layout.addView(switchCameraButton, switchParams);
        
        // Create modern flash button (top left)
        flashButton = new Button(this);
        flashButton.setText("⚡"); // Lightning bolt
        flashButton.setTextSize(20);
        flashButton.setBackgroundColor(0xCC000000); // More opaque black
        flashButton.setTextColor(0xFFFFFFFF);
        flashButton.setWidth(60);
        flashButton.setHeight(60);
        flashButton.setPadding(0, 0, 0, 0);
        
        RelativeLayout.LayoutParams flashParams = new RelativeLayout.LayoutParams(60, 60);
        flashParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        flashParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        flashParams.topMargin = 120; // More space from top for safe area
        flashParams.leftMargin = 20;
        layout.addView(flashButton, flashParams);
        
        // Set click listeners
        recordButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!isRecording) {
                    startRecording();
                } else {
                    stopRecording();
                }
            }
        });
        
        switchCameraButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                switchCamera();
            }
        });
        
        flashButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                toggleFlash();
            }
        });
    }
    
    private void startCamera() {
        try {
            Log.d(TAG, "Starting camera setup");
            ListenableFuture<ProcessCameraProvider> cameraProviderFuture = 
                ProcessCameraProvider.getInstance(this);
                
            cameraProviderFuture.addListener(() -> {
                try {
                    Log.d(TAG, "Camera provider future completed");
                    cameraProvider = cameraProviderFuture.get();
                    Log.d(TAG, "Got camera provider: " + (cameraProvider != null));
                    
                    Preview preview = new Preview.Builder().build();
                    Log.d(TAG, "Created preview: " + (preview != null));
                    
                    // Create ImageCapture for flash control
                    imageCapture = new ImageCapture.Builder().build();
                    
                    if (previewView != null) {
                        preview.setSurfaceProvider(previewView.getSurfaceProvider());
                        Log.d(TAG, "Set surface provider");
                    } else {
                        Log.e(TAG, "PreviewView is null!");
                        return;
                    }
                    
                    CameraSelector cameraSelector = isFrontCamera ? 
                        CameraSelector.DEFAULT_FRONT_CAMERA : CameraSelector.DEFAULT_BACK_CAMERA;
                    Log.d(TAG, "Created camera selector for: " + (isFrontCamera ? "front" : "back"));
                    
                    cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
                    Log.d(TAG, "Camera bound to lifecycle successfully");
                    
                } catch (ExecutionException | InterruptedException e) {
                    Log.e(TAG, "Error starting camera", e);
                    Toast.makeText(this, "Error starting camera: " + e.getMessage(), Toast.LENGTH_LONG).show();
                } catch (Exception e) {
                    Log.e(TAG, "Unexpected error in camera setup", e);
                    Toast.makeText(this, "Camera setup failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }, ContextCompat.getMainExecutor(this));
            
        } catch (Exception e) {
            Log.e(TAG, "Error in startCamera", e);
            Toast.makeText(this, "Failed to start camera: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
    
    private void switchCamera() {
        Log.d(TAG, "Switching camera from " + (isFrontCamera ? "front" : "back") + " to " + (!isFrontCamera ? "front" : "back"));
        isFrontCamera = !isFrontCamera;
        
        // Disable flash for front camera
        if (isFrontCamera && isFlashOn) {
            isFlashOn = false;
            flashButton.setText("⚡");
            flashButton.setBackgroundColor(0xCC000000);
            flashButton.setTextColor(0xFFFFFFFF);
        }
        
        // Restart camera with new selector
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            startCamera();
        }
    }
    
    private void toggleFlash() {
        if (isFrontCamera) {
            Toast.makeText(this, "Flash not available on front camera", Toast.LENGTH_SHORT).show();
            return;
        }
        
        isFlashOn = !isFlashOn;
        Log.d(TAG, "Flash toggled to: " + (isFlashOn ? "ON" : "OFF"));
        
        if (imageCapture != null) {
            imageCapture.setFlashMode(isFlashOn ? ImageCapture.FLASH_MODE_ON : ImageCapture.FLASH_MODE_OFF);
        }
        
        // Update button appearance
        if (isFlashOn) {
            flashButton.setText("⚡");
            flashButton.setBackgroundColor(0xCCFFD700); // Gold when on
            flashButton.setTextColor(0xFF000000); // Black text when on
        } else {
            flashButton.setText("⚡");
            flashButton.setBackgroundColor(0xCC000000); // Black when off
            flashButton.setTextColor(0xFFFFFFFF); // White text when off
        }
    }
    
    private void startRecording() {
        Log.d(TAG, "Starting recording");
        isRecording = true;
        
        // Animate button morph from circle to rounded square
        animateToRecordingState();
        
        Toast.makeText(this, "Recording started", Toast.LENGTH_SHORT).show();
    }
    
    private void stopRecording() {
        Log.d(TAG, "Stopping recording");
        isRecording = false;
        
        // Animate button morph back to circle with bounce effect
        animateToIdleState();
        
        Toast.makeText(this, "Recording stopped", Toast.LENGTH_SHORT).show();
        
        // Return mock result for now
        Intent data = new Intent();
        data.putExtra("videoUri", "file:///sdcard/Movies/story-video-" + System.currentTimeMillis() + ".mp4");
        setResult(Activity.RESULT_OK, data);
        finish();
    }
    
    private void animateToRecordingState() {
        // Haptic feedback when recording starts
        triggerHapticFeedback();
        
        // Remove text completely for clean look
        recordButton.setText("");
        
        // Create rounded square background with Octo accent fill
        GradientDrawable recordingDrawable = new GradientDrawable();
        recordingDrawable.setShape(GradientDrawable.RECTANGLE);
        recordingDrawable.setCornerRadius(25); // More rounded square
        recordingDrawable.setColor(0xFFFF7F5A); // Octo accent fill
        recordingDrawable.setStroke(4, 0xFFFF7F5A); // Matching border
        
        // Animate size change and background morph (circle to rounded square)
        AnimatorSet animatorSet = new AnimatorSet();
        
        // Size animation (120px circle to 140px rounded square)
        ObjectAnimator widthAnim = ObjectAnimator.ofInt(recordButton, "width", 120, 140);
        ObjectAnimator heightAnim = ObjectAnimator.ofInt(recordButton, "height", 120, 140);
        
        // Background change
        recordButton.setBackground(recordingDrawable);
        
        // Combine animations with spring effect (250ms as specified)
        animatorSet.playTogether(widthAnim, heightAnim);
        animatorSet.setDuration(250);
        animatorSet.setInterpolator(new OvershootInterpolator(1.2f)); // Spring effect
        
        animatorSet.addListener(new android.animation.AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(android.animation.Animator animation) {
                // Start pulsing ring animation after morph completes
                startPulsingRing();
            }
        });
        
        animatorSet.start();
    }
    
    private void animateToIdleState() {
        // Stop pulsing ring
        stopPulsingRing();
        
        // Change text back to record dot
        recordButton.setText("●");
        recordButton.setTextColor(0xFFFFFFFF);
        
        // Create circular background with Octo accent border
        GradientDrawable idleDrawable = new GradientDrawable();
        idleDrawable.setShape(GradientDrawable.OVAL);
        idleDrawable.setColor(0xFFFFFFFF); // White background
        idleDrawable.setStroke(8, 0xFFFF7F5A); // Octo accent border
        
        // Animate size change and background morph (rounded square back to circle)
        AnimatorSet animatorSet = new AnimatorSet();
        
        // Size animation (140px rounded square back to 120px circle)
        ObjectAnimator widthAnim = ObjectAnimator.ofInt(recordButton, "width", 140, 120);
        ObjectAnimator heightAnim = ObjectAnimator.ofInt(recordButton, "height", 140, 120);
        
        // Background change
        recordButton.setBackground(idleDrawable);
        
        // Combine animations with bounce effect
        animatorSet.playTogether(widthAnim, heightAnim);
        animatorSet.setDuration(200);
        animatorSet.setInterpolator(new BounceInterpolator());
        animatorSet.start();
    }
    
    private void startPulsingRing() {
        if (pulseAnimator != null) {
            pulseAnimator.cancel();
        }
        
        // Create pulsing animation for the ring
        pulseAnimator = ValueAnimator.ofFloat(1.0f, 1.3f, 1.0f);
        pulseAnimator.setDuration(1000); // 1 second pulse cycle
        pulseAnimator.setRepeatCount(ValueAnimator.INFINITE);
        pulseAnimator.setRepeatMode(ValueAnimator.RESTART);
        
        pulseAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator animation) {
                float scale = (Float) animation.getAnimatedValue();
                pulsingRing.setScaleX(scale);
                pulsingRing.setScaleY(scale);
                
                // Also animate opacity for glowing effect
                float alpha = 0.3f + (0.4f * (float) Math.sin(animation.getAnimatedFraction() * Math.PI * 2));
                pulsingRing.setAlpha(alpha);
            }
        });
        
        pulseAnimator.start();
    }
    
    private void stopPulsingRing() {
        if (pulseAnimator != null) {
            pulseAnimator.cancel();
            pulseAnimator = null;
        }
        
        // Reset ring to normal state
        pulsingRing.setScaleX(1.0f);
        pulsingRing.setScaleY(1.0f);
        pulsingRing.setAlpha(0.0f); // Hide the ring
    }
    
    private void triggerHapticFeedback() {
        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(50);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not trigger haptic feedback", e);
        }
    }
    
    @Override
    public void onBackPressed() {
        Log.d(TAG, "onBackPressed - user cancelled recording");
        // Return cancelled result when user presses back button
        Intent data = new Intent();
        data.putExtra("error", "Recording cancelled by user");
        setResult(Activity.RESULT_CANCELED, data);
        finish();
    }
    
    @Override
    protected void onDestroy() {
        Log.d(TAG, "onDestroy - activity being destroyed");
        
        // Stop any running animations
        stopPulsingRing();
        
        // If activity is being destroyed and we haven't set a result yet, 
        // it means the user left without recording
        if (!isFinishing()) {
            Log.d(TAG, "Activity destroyed without finishing - user left without recording");
            Intent data = new Intent();
            data.putExtra("error", "Recording cancelled - user left activity");
            setResult(Activity.RESULT_CANCELED, data);
        }
        
        // Clean up camera resources
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
        
        super.onDestroy();
    }
}

