package app.lovable.velyar.storycamera;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Drawable;
import androidx.core.content.ContextCompat;
import android.view.WindowManager;
import android.os.Build;
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
import android.view.ScaleGestureDetector;
import android.view.MotionEvent;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.widget.TextView;
import android.os.CountDownTimer;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.Preview;
import androidx.camera.video.Recorder;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.camera.video.Recording;
import androidx.camera.video.PendingRecording;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Quality;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraInfo;
import androidx.core.content.ContextCompat;
import androidx.core.app.ActivityCompat;
import android.Manifest;
import android.content.pm.PackageManager;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.Date;

import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.ExecutionException;

public class StoryCameraActivity extends AppCompatActivity {
    private static final String TAG = "StoryCameraActivity";
    private PreviewView previewView;
    private Button recordButton;
    private ImageButton switchCameraButton;
    private ImageButton flashButton;
    private View pulsingRing;
    private ValueAnimator pulseAnimator;
    private boolean isRecording = false;
    private boolean isFlashOn = false;
    private boolean isFrontCamera = false;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private ImageCapture imageCapture;
    private VideoCapture<Recorder> videoCapture;
    private Recording recording;
    private File videoFile;
    private static final int REQUEST_CODE_PERMISSIONS = 10;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.WRITE_EXTERNAL_STORAGE
    };
    
    // Zoom-related fields
    private ScaleGestureDetector scaleGestureDetector;
    private float currentZoomRatio = 1.0f;
    private float minZoomRatio = 1.0f;
    private float maxZoomRatio = 10.0f;
    private boolean zoomEnabled = true;
    private TextView countdownLabel;
    private CountDownTimer countdownTimer;
    private int maxDurationSeconds = 30;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate - launching StoryCamera activity");
        
        try {
            // Hide action bar for full-screen experience
            if (getSupportActionBar() != null) {
                getSupportActionBar().hide();
            }

            // Make system bars transparent and full-screen
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }

            // Make status bar and navigation bar transparent
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
                getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
            }

            // Keep screen on during camera usage
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

            setContentView(R.layout.sc_activity_story_camera);
            Log.d(TAG, "Layout set successfully");
            
            previewView = findViewById(R.id.sc_preview_view);
            Log.d(TAG, "PreviewView found: " + (previewView != null));
            
            if (previewView == null) {
                Log.e(TAG, "PreviewView is null - cannot setup camera controls");
                throw new RuntimeException("PreviewView not found in layout");
            }
            
            Log.d(TAG, "About to call setupCameraControls");
            setupCameraControls();
            Log.d(TAG, "setupCameraControls completed successfully");
            
            // Initialize scale gesture detector for pinch-to-zoom
            setupZoomGestureDetector();
            Log.d(TAG, "Zoom gesture detector setup completed");
            
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
        Log.d(TAG, "setupCameraControls called");
        RelativeLayout layout = (RelativeLayout) previewView.getParent();
        Log.d(TAG, "Got parent layout: " + (layout != null));
        
        if (layout == null) {
            Log.e(TAG, "Parent layout is null - cannot add camera controls");
            throw new RuntimeException("PreviewView parent layout is null");
        }
        
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
        recordButton.setText(""); // No text - clean circle
        recordButton.setWidth(120); // Much larger button
        recordButton.setHeight(120);
        recordButton.setPadding(0, 0, 0, 0);
        
        // Create circular background with only outer Octo accent border (transparent inside)
        GradientDrawable circularDrawable = new GradientDrawable();
        circularDrawable.setShape(GradientDrawable.OVAL);
        circularDrawable.setColor(0x00000000); // Transparent background
        circularDrawable.setStroke(8, 0xFFFF7F5A); // Only outer Octo accent border
        recordButton.setBackground(circularDrawable);
        
        RelativeLayout.LayoutParams recordParams = new RelativeLayout.LayoutParams(120, 120);
        recordParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        recordParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        recordParams.bottomMargin = 120; // More space from bottom for safe area
        layout.addView(recordButton, recordParams);
        Log.d(TAG, "Record button added to layout - width: " + recordButton.getWidth() + ", height: " + recordButton.getHeight());
        
        // (Removed) Text tool button

        // Create palette/filter button (bottom right of record button) with proper icon - large circle
        ImageButton paletteButton = new ImageButton(this);
        paletteButton.setImageResource(R.drawable.ic_palette);
        paletteButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        paletteButton.setPadding(25, 25, 25, 25);
        
        // Create circular background for palette button
        GradientDrawable paletteDrawable = new GradientDrawable();
        paletteDrawable.setShape(GradientDrawable.OVAL);
        paletteDrawable.setColor(0xCC000000); // Semi-transparent black
        paletteButton.setBackground(paletteDrawable);

        RelativeLayout.LayoutParams paletteParams = new RelativeLayout.LayoutParams(100, 100);
        paletteParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        paletteParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        paletteParams.bottomMargin = 120;
        paletteParams.rightMargin = 60; // Move closer to center
        layout.addView(paletteButton, paletteParams);

        // Create modern switch camera button (bottom center, next to record button) with proper icon - large circle
        switchCameraButton = new ImageButton(this);
        switchCameraButton.setImageResource(R.drawable.ic_camera_switch_new);
        switchCameraButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        switchCameraButton.setPadding(25, 25, 25, 25);
        
        // Create circular background for switch camera button
        GradientDrawable switchDrawable = new GradientDrawable();
        switchDrawable.setShape(GradientDrawable.OVAL);
        switchDrawable.setColor(0xCC000000); // Semi-transparent black
        switchCameraButton.setBackground(switchDrawable);

        RelativeLayout.LayoutParams switchParams = new RelativeLayout.LayoutParams(100, 100);
        switchParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        switchParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        switchParams.bottomMargin = 120;
        switchParams.rightMargin = 180; // Position between record button and palette
        layout.addView(switchCameraButton, switchParams);
        
        // Create close button (top left) with proper X icon - smaller circle
        ImageButton closeButton = new ImageButton(this);
        closeButton.setImageResource(R.drawable.ic_close);
        closeButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        closeButton.setPadding(20, 20, 20, 20);
        
        // Create circular background for close button
        GradientDrawable closeDrawable = new GradientDrawable();
        closeDrawable.setShape(GradientDrawable.OVAL);
        closeDrawable.setColor(0xCC000000); // Semi-transparent black
        closeButton.setBackground(closeDrawable);
        
        RelativeLayout.LayoutParams closeParams = new RelativeLayout.LayoutParams(80, 80); // Smaller size
        closeParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        closeParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        closeParams.topMargin = 120; // More space from top for safe area
        closeParams.leftMargin = 60; // Move closer to center
        layout.addView(closeButton, closeParams);

        // Create modern flash button (top right) with proper icon - large circle
        flashButton = new ImageButton(this);
        flashButton.setImageResource(R.drawable.ic_flash_off);
        flashButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        flashButton.setPadding(25, 25, 25, 25);
        
        // Create circular background for flash button
        GradientDrawable flashDrawable = new GradientDrawable();
        flashDrawable.setShape(GradientDrawable.OVAL);
        flashDrawable.setColor(0xCC000000); // Semi-transparent black
        flashButton.setBackground(flashDrawable);
        
        RelativeLayout.LayoutParams flashParams = new RelativeLayout.LayoutParams(100, 100);
        flashParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        flashParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        flashParams.topMargin = 120; // More space from top for safe area
        flashParams.rightMargin = 60; // Move closer to center
        layout.addView(flashButton, flashParams);

        // Countdown label (top center)
        countdownLabel = new TextView(this);
        countdownLabel.setTextColor(0xFFFFFFFF);
        countdownLabel.setTextSize(16f);
        countdownLabel.setText("");
        RelativeLayout.LayoutParams cdParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        cdParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        cdParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        cdParams.topMargin = 140; // center between close and flash buttons
        layout.addView(countdownLabel, cdParams);
        
        // Set click listeners
        closeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d(TAG, "Close button clicked - exiting camera");
                onBackPressed();
            }
        });
        
        recordButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d(TAG, "Record button clicked - isRecording: " + isRecording);
                if (!isRecording) {
                    Log.d(TAG, "Starting recording from button click");
                    startRecording();
                } else {
                    Log.d(TAG, "Stopping recording from button click");
                    stopRecording();
                }
            }
        });
        Log.d(TAG, "Record button click listener set up successfully");
        Log.d(TAG, "Record button visibility: " + recordButton.getVisibility() + ", enabled: " + recordButton.isEnabled());
        
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
    
    private void setupZoomGestureDetector() {
        if (!zoomEnabled) {
            Log.d(TAG, "Zoom is disabled, skipping gesture detector setup");
            return;
        }
        
        scaleGestureDetector = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScale(ScaleGestureDetector detector) {
                if (!zoomEnabled) return false;
                
                float scaleFactor = detector.getScaleFactor();
                float newZoomRatio = currentZoomRatio * scaleFactor;
                
                // Clamp zoom ratio between min and max values
                newZoomRatio = Math.max(minZoomRatio, Math.min(maxZoomRatio, newZoomRatio));
                
                if (newZoomRatio != currentZoomRatio) {
                    currentZoomRatio = newZoomRatio;
                    applyZoomToCamera();
                    Log.d(TAG, "Zoom ratio changed to: " + currentZoomRatio);
                }
                
                return true;
            }
        });
        
        // Enable touch events on the preview view for zoom gestures
        previewView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                return zoomEnabled && scaleGestureDetector.onTouchEvent(event);
            }
        });
    }
    
    private void applyZoomToCamera() {
        if (camera != null) {
            camera.getCameraControl().setZoomRatio(currentZoomRatio);
        }
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
                    
                    // Create VideoCapture for video recording
                    Recorder recorder = new Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                        .build();
                    videoCapture = VideoCapture.withOutput(recorder);
                    
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
                    
                    camera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture, videoCapture);
                    Log.d(TAG, "Camera bound to lifecycle successfully");
                    
                    // Get zoom range from the camera and update zoom limits
                    updateZoomRange();
                    
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
    
    private void updateZoomRange() {
        if (camera != null) {
            try {
                CameraInfo cameraInfo = camera.getCameraInfo();
                minZoomRatio = cameraInfo.getZoomState().getValue().getMinZoomRatio();
                float cameraMaxZoom = cameraInfo.getZoomState().getValue().getMaxZoomRatio();
                // Use the smaller of camera max zoom or configured max zoom
                maxZoomRatio = Math.min(cameraMaxZoom, 10.0f); // Default max is 10.0f
                Log.d(TAG, "Zoom range updated - Min: " + minZoomRatio + ", Max: " + maxZoomRatio);
            } catch (Exception e) {
                Log.w(TAG, "Could not get zoom range, using defaults", e);
                minZoomRatio = 1.0f;
                maxZoomRatio = 10.0f;
            }
        }
    }
    
    private void switchCamera() {
        Log.d(TAG, "Switching camera from " + (isFrontCamera ? "front" : "back") + " to " + (!isFrontCamera ? "front" : "back"));
        isFrontCamera = !isFrontCamera;
        
        // Reset zoom when switching cameras
        currentZoomRatio = 1.0f;
        
        // Disable flash for front camera
        if (isFrontCamera && isFlashOn) {
            isFlashOn = false;
            flashButton.setImageResource(R.drawable.ic_flash_off);
            GradientDrawable flashDrawable = new GradientDrawable();
            flashDrawable.setShape(GradientDrawable.OVAL);
            flashDrawable.setColor(0xCC000000);
            flashButton.setBackground(flashDrawable);
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
        GradientDrawable flashDrawable = new GradientDrawable();
        flashDrawable.setShape(GradientDrawable.OVAL);
        
        if (isFlashOn) {
            flashButton.setImageResource(R.drawable.ic_flash_on);
            flashDrawable.setColor(0xCCFFD700); // Gold when on
        } else {
            flashButton.setImageResource(R.drawable.ic_flash_off);
            flashDrawable.setColor(0xCC000000); // Black when off
        }
        flashButton.setBackground(flashDrawable);
    }
    
    private void startRecording() {
        Log.d(TAG, "Starting recording");
        Log.d(TAG, "VideoCapture is null: " + (videoCapture == null));
        Log.d(TAG, "Is recording: " + isRecording);
        
        if (videoCapture == null) {
            Log.e(TAG, "VideoCapture is null - cannot start recording");
            Toast.makeText(this, "Camera not ready for recording", Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Create video file
        videoFile = createVideoFile();
        if (videoFile == null) {
            Log.e(TAG, "Failed to create video file");
            Toast.makeText(this, "Failed to create video file", Toast.LENGTH_SHORT).show();
            return;
        }
        
        Log.d(TAG, "Video file created: " + videoFile.getAbsolutePath());
        
        // Create output file options
        FileOutputOptions outputOptions = new FileOutputOptions.Builder(videoFile).build();
        Log.d(TAG, "FileOutputOptions created");
        
        // Start recording
        Log.d(TAG, "About to prepare recording");
        PendingRecording pendingRecording = videoCapture.getOutput()
            .prepareRecording(this, outputOptions);
        Log.d(TAG, "PendingRecording created: " + (pendingRecording != null));
            
        Log.d(TAG, "About to start recording");
        recording = pendingRecording.start(ContextCompat.getMainExecutor(this), videoRecordEvent -> {
            Log.d(TAG, "VideoRecordEvent received: " + videoRecordEvent.getClass().getSimpleName());
            if (videoRecordEvent instanceof VideoRecordEvent.Finalize) {
                VideoRecordEvent.Finalize finalizeEvent = (VideoRecordEvent.Finalize) videoRecordEvent;
                Log.d(TAG, "Finalize event hasError: " + finalizeEvent.hasError());
                if (finalizeEvent.hasError()) {
                    Log.e(TAG, "Video recording error: " + finalizeEvent.getError());
                    isRecording = false;
                    // Stop timer
                    try { if (countdownTimer != null) { countdownTimer.cancel(); countdownTimer = null; } } catch (Exception ignore) {}
                    animateToIdleState();
                    Toast.makeText(StoryCameraActivity.this, "Recording failed: " + finalizeEvent.getError(), Toast.LENGTH_LONG).show();
                    // Return error result
                    setResult(Activity.RESULT_CANCELED);
                    finish();
                } else {
                    Log.d(TAG, "Finalize event hasError: false - entering success branch");
                    Log.d(TAG, "About to set isRecording to false");
                    isRecording = false;
                    // Stop timer
                    try { if (countdownTimer != null) { countdownTimer.cancel(); countdownTimer = null; } } catch (Exception ignore) {}
                    Log.d(TAG, "About to call animateToIdleState");
                    animateToIdleState();
                    Log.d(TAG, "Video saved successfully: " + videoFile.getAbsolutePath());

                    // Save to shared preferences for React-side polling fallback
                    try {
                        android.content.SharedPreferences prefs = getSharedPreferences("StoryCamera", MODE_PRIVATE);
                        android.content.SharedPreferences.Editor editor = prefs.edit();
                        if (videoFile != null) {
                            editor.putString("lastVideoPath", videoFile.getAbsolutePath());
                        }
                        editor.putBoolean("shouldNavigateToTest", true);
                        editor.apply();
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to write SharedPreferences: " + e.getMessage());
                    }

                    // Auto-finish and return result to the plugin so React can navigate
                    try {
                        Intent intent = new Intent();
                        intent.putExtra("videoUri", videoFile != null ? videoFile.getAbsolutePath() : null);
                        if (videoFile != null) {
                            intent.putExtra(
                                "contentUri",
                                FileProvider.getUriForFile(
                                    StoryCameraActivity.this,
                                    getApplicationContext().getPackageName() + ".fileprovider",
                                    videoFile
                                ).toString()
                            );
                        }
                        setResult(Activity.RESULT_OK, intent);
                        finish();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to set result on finalize: " + e.getMessage());
                        setResult(Activity.RESULT_CANCELED);
                        finish();
                    }
                }
            }
        });
        Log.d(TAG, "Recording started successfully");
        
        isRecording = true;
        
        // Animate button morph from circle to rounded square
        animateToRecordingState();
        
        // Start 30s countdown and auto-stop
        try {
            if (countdownTimer != null) {
                countdownTimer.cancel();
                countdownTimer = null;
            }
            countdownTimer = new CountDownTimer(maxDurationSeconds * 1000L, 500L) {
                @Override
                public void onTick(long millisUntilFinished) {
                    long totalSec = Math.max(0L, millisUntilFinished / 1000L);
                    String text = String.format(java.util.Locale.getDefault(), "%02d:%02d", totalSec / 60, totalSec % 60);
                    countdownLabel.setText(text);
                }

                @Override
                public void onFinish() {
                    countdownLabel.setText("00:00");
                    stopRecording();
                }
            };
            countdownTimer.start();
        } catch (Exception ignore) {}

        Toast.makeText(this, "Recording started", Toast.LENGTH_SHORT).show();
    }
    
    private void stopRecording() {
        Log.d(TAG, "Stopping recording");
        
        if (recording != null && isRecording) {
            recording.stop();
            recording = null;
            Log.d(TAG, "Stop recording called on Recording");
        } else {
            Log.w(TAG, "Cannot stop recording - recording is null or not recording");
            isRecording = false;
            animateToIdleState();
        }
        try { if (countdownTimer != null) { countdownTimer.cancel(); countdownTimer = null; } } catch (Exception ignore) {}
        if (countdownLabel != null) countdownLabel.setText("");
        
        Toast.makeText(this, "Recording stopped", Toast.LENGTH_SHORT).show();
    }
    
    private File createVideoFile() {
        try {
            // Create a unique filename with timestamp
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "STORY_" + timeStamp + ".mp4";
            
            // Get the external storage directory for movies
            File mediaDir = new File(getExternalFilesDir(null), "Movies");
            if (!mediaDir.exists()) {
                if (!mediaDir.mkdirs()) {
                    Log.e(TAG, "Failed to create Movies directory");
                    return null;
                }
            }
            
            File videoFile = new File(mediaDir, fileName);
            Log.d(TAG, "Created video file: " + videoFile.getAbsolutePath());
            return videoFile;
            
        } catch (Exception e) {
            Log.e(TAG, "Error creating video file", e);
            return null;
        }
    }
    
    private void animateToRecordingState() {
        // Haptic feedback when recording starts
        triggerHapticFeedback();
        
        // Remove text completely for clean look
        recordButton.setText("");
        
        // Create rounded square background with Octo accent fill (no stroke to avoid double circle)
        GradientDrawable recordingDrawable = new GradientDrawable();
        recordingDrawable.setShape(GradientDrawable.RECTANGLE);
        recordingDrawable.setCornerRadius(25); // More rounded square
        recordingDrawable.setColor(0xFFFF7F5A); // Octo accent fill
        // No stroke to avoid inner orange circle
        
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
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-apply full-screen mode when window gains focus
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }
        }
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
    
    private Class<?> getMainActivityClass() {
        try {
            // Use the exact package name from the MainActivity
            return Class.forName("app.lovable.e717c17b39ea497bb3f0803db35e66f4.MainActivity");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "MainActivity class not found: " + e.getMessage());
            // Fallback to the current activity
            return StoryCameraActivity.class;
        }
    }
}

