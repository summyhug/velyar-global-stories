package com.velyar.storycamera;

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
import android.graphics.PorterDuff;
import android.graphics.drawable.InsetDrawable;
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
    private boolean isInfoPressed = false;
    private ProcessCameraProvider cameraProvider;
    private Camera camera;
    private ImageCapture imageCapture;
    private VideoCapture<Recorder> videoCapture;
    private Recording recording;
    private File videoFile;
    private static final int REQUEST_CODE_PERMISSIONS = 10;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    };
    
    // Zoom-related fields
    private ScaleGestureDetector scaleGestureDetector;
    private float currentZoomRatio = 1.0f;
    private float minZoomRatio = 1.0f;
    private float maxZoomRatio = 10.0f;
    private boolean zoomEnabled = true;
    // Simple filter overlay and index
    private View filterOverlay;
    private TextView filterLabel;
    private int currentFilterIndex = 0; // 0=None, 1=Warm, 2=Cool, 3=Sunset, 4=Film
    private TextView countdownLabel;
    private CountDownTimer countdownTimer;
    private int maxDurationSeconds = 30;
    
    // Context variables to pass back
    private String activityContextType = null;
    private String activityMissionId = null;
    private String activityPromptId = null;
    private String activityPromptName = null;
    
    // UI elements for info button and prompt display
    private ImageButton infoButton;
    private TextView promptText;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate - launching StoryCamera activity");
        
        // Read context from intent
        Intent intent = getIntent();
        this.activityPromptName = intent.getStringExtra("promptName");
        this.activityContextType = intent.getStringExtra("contextType");
        this.activityMissionId = intent.getStringExtra("missionId");
        this.activityPromptId = intent.getStringExtra("promptId");
        
        // Check permissions first
        if (!allPermissionsGranted()) {
            Log.d(TAG, "Requesting permissions");
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS);
            return;
        } else {
            Log.d(TAG, "All permissions already granted, proceeding with camera setup");
        }
        
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
            
            // Start camera since permissions are already granted
            Log.d(TAG, "Starting camera - permissions already granted");
            startCamera();
            
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
        
        // Add a full-screen filter overlay above the preview
        filterOverlay = new View(this);
        filterOverlay.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        RelativeLayout.LayoutParams overlayParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.MATCH_PARENT);
        overlayParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        overlayParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        overlayParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        overlayParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        layout.addView(filterOverlay, overlayParams);

        // Filter name label (top center)
        filterLabel = new TextView(this);
        filterLabel.setTextColor(0xFFFFFFFF);
        filterLabel.setTextSize(18f);
        // No drop shadow for a cleaner look
        filterLabel.setAlpha(0f);
        filterLabel.setVisibility(View.GONE);
        RelativeLayout.LayoutParams flParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        flParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        flParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        flParams.topMargin = 120; // between the close and flash buttons
        layout.addView(filterLabel, flParams);


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
        // Remove default elevation/shadow
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                recordButton.setStateListAnimator(null);
            }
            recordButton.setElevation(0f);
            recordButton.setTranslationZ(0f);
        } catch (Exception ignored) {}
        
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
        // Ensure consistent icon color
        paletteButton.setColorFilter(0xFFFFFFFF, PorterDuff.Mode.SRC_IN);
        
        // Create circular background for palette button
        GradientDrawable paletteDrawable = new GradientDrawable();
        paletteDrawable.setShape(GradientDrawable.OVAL);
        paletteDrawable.setColor(0xCC000000); // Semi-transparent black
        paletteButton.setBackground(paletteDrawable);
        // Temporarily hide theme/palette button
        paletteButton.setVisibility(View.GONE);

        RelativeLayout.LayoutParams paletteParams = new RelativeLayout.LayoutParams(110, 110);
        paletteParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        paletteParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        paletteParams.bottomMargin = 120;
        paletteParams.rightMargin = 60; // Move closer to center
        layout.addView(paletteButton, paletteParams);

        // Create modern switch camera button (bottom center, next to record button) with proper icon - large circle
        switchCameraButton = new ImageButton(this);
        // Use the vector drawable now present in the plugin resources
        switchCameraButton.setImageResource(R.drawable.flip_camera_ios_24);
        // Tint icon to white so it is visible on dark background
        switchCameraButton.setColorFilter(0xFFFFFFFF, PorterDuff.Mode.SRC_IN);
        switchCameraButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        switchCameraButton.setPadding(25, 25, 25, 25);
        
        // Create circular background for switch camera button
        GradientDrawable switchDrawable = new GradientDrawable();
        switchDrawable.setShape(GradientDrawable.OVAL);
        switchDrawable.setColor(0xCC000000); // Semi-transparent black
        switchCameraButton.setBackground(switchDrawable);

        RelativeLayout.LayoutParams switchParams = new RelativeLayout.LayoutParams(110, 110);
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
        
        RelativeLayout.LayoutParams closeParams = new RelativeLayout.LayoutParams(110, 110); // match other buttons
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
        
        RelativeLayout.LayoutParams flashParams = new RelativeLayout.LayoutParams(110, 110);
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
        
        // Prompt text display (above record button)
        promptText = new TextView(this);
        promptText.setTextColor(0xFFFFFFFF);
        promptText.setTextSize(14f);
        promptText.setTypeface(null, android.graphics.Typeface.BOLD);
        promptText.setGravity(android.view.Gravity.CENTER);
        promptText.setPadding(16, 8, 16, 8);
        promptText.setVisibility(View.GONE); // Initially hidden
        
        // Configure text wrapping for long prompts
        promptText.setSingleLine(false);
        promptText.setMaxLines(4); // Allow up to 4 lines
        promptText.setEllipsize(android.text.TextUtils.TruncateAt.END);
        promptText.setLineSpacing(2, 1.0f); // Add some line spacing
        RelativeLayout.LayoutParams promptParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.MATCH_PARENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
        promptParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        promptParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
        promptParams.bottomMargin = 280; // Higher above the record button to avoid intersection
        layout.addView(promptText, promptParams);
        
        // Info button (left of record button)
        infoButton = new ImageButton(this);
        infoButton.setImageResource(R.drawable.info_24);
        infoButton.setScaleType(ImageButton.ScaleType.CENTER_INSIDE);
        infoButton.setPadding(20, 20, 20, 20);
        
        // Create circular background for info button (unpressed state)
        GradientDrawable infoDrawable = new GradientDrawable();
        infoDrawable.setShape(GradientDrawable.OVAL);
        infoDrawable.setColor(0xCC000000); // Semi-transparent black
        infoButton.setBackground(infoDrawable);
        
        RelativeLayout.LayoutParams infoParams = new RelativeLayout.LayoutParams(110, 110);
        infoParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        infoParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        infoParams.bottomMargin = 120;
        infoParams.leftMargin = 180; // Same distance as switch camera button (180px from right)
        layout.addView(infoButton, infoParams);
        
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
                // Rotate icon for interactivity, then switch camera
                switchCameraButton.animate()
                    .rotationBy(180f)
                    .setDuration(200)
                    .withEndAction(new Runnable() {
                        @Override
                        public void run() {
                            switchCamera();
                        }
                    })
                    .start();
            }
        });
        
        flashButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                toggleFlash();
            }
        });
        
        // Info button click listener
        infoButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                togglePromptDisplay();
            }
        });
        
        // Set up prompt text if available (but keep it hidden by default)
        if (activityPromptName != null && !activityPromptName.isEmpty()) {
            promptText.setText(activityPromptName);
            promptText.setVisibility(View.GONE); // Hidden by default, user must tap info button
        }

        // Cycle through simple filter overlays
        paletteButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                currentFilterIndex = (currentFilterIndex + 1) % 5;
                applyFilterOverlay(currentFilterIndex);
                String name;
                switch (currentFilterIndex) {
                    case 1: name = "Warm Glow"; break;
                    case 2: name = "Cool Mist"; break;
                    case 3: name = "Sunset"; break;
                    case 4: name = "Film Fade"; break;
                    default: name = "None"; break;
                }
                showFilterLabel(name);
                // Subtle pulse on theme change
                paletteButton.animate().scaleX(0.92f).scaleY(0.92f).setDuration(90)
                    .withEndAction(new Runnable() {
                        @Override
                        public void run() {
                            paletteButton.animate().scaleX(1f).scaleY(1f).setDuration(120).start();
                        }
                    }).start();
            }
        });
    }

    private void applyFilterOverlay(int index) {
        if (filterOverlay == null) return;
        switch (index) {
            case 0: // None
                filterOverlay.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                break;
            case 1: // Warm
                filterOverlay.setBackgroundColor(android.graphics.Color.argb(80, 255, 183, 77));
                break;
            case 2: // Cool
                filterOverlay.setBackgroundColor(android.graphics.Color.argb(80, 64, 156, 255));
                break;
            case 3: // Sunset
                filterOverlay.setBackgroundColor(android.graphics.Color.argb(80, 255, 99, 132));
                break;
            case 4: // Film dim
                filterOverlay.setBackgroundColor(android.graphics.Color.argb(70, 20, 20, 20));
                break;
            default:
                filterOverlay.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        }
    }

    private void showFilterLabel(String name) {
        if (filterLabel == null) return;
        try {
            filterLabel.setText(name);
            filterLabel.setVisibility(View.VISIBLE);
            filterLabel.animate().cancel();
            filterLabel.setAlpha(1f);
            filterLabel.animate()
                .alpha(0f)
                .setStartDelay(900)
                .setDuration(400)
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        filterLabel.setVisibility(View.GONE);
                    }
                })
                .start();
        } catch (Exception ignored) {}
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
                    
                    // Create VideoCapture for video recording (audio enabled by default)
                    Recorder recorder = new Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                        .build();
                    videoCapture = VideoCapture.withOutput(recorder);
                    Log.d(TAG, "VideoCapture created with default audio settings");
                    
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
            // Flash not available on front camera - no need for toast
            return;
        }
        
        isFlashOn = !isFlashOn;
        Log.d(TAG, "Flash toggled to: " + (isFlashOn ? "ON" : "OFF"));
        
        if (imageCapture != null) {
            imageCapture.setFlashMode(isFlashOn ? ImageCapture.FLASH_MODE_ON : ImageCapture.FLASH_MODE_OFF);
        }
        // Also toggle torch for preview/recording
        try {
            if (camera != null && camera.getCameraInfo() != null && camera.getCameraInfo().hasFlashUnit()) {
                camera.getCameraControl().enableTorch(isFlashOn);
            }
        } catch (Exception e) {
            Log.w(TAG, "enableTorch failed: " + e.getMessage());
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
    
    private void togglePromptDisplay() {
        if (promptText == null || activityPromptName == null || activityPromptName.isEmpty()) {
            return;
        }
        
        isInfoPressed = !isInfoPressed;
        
        if (isInfoPressed) {
            promptText.setVisibility(View.VISIBLE);
        } else {
            promptText.setVisibility(View.GONE);
        }
        
        // Update button appearance based on state
        GradientDrawable infoDrawable = new GradientDrawable();
        infoDrawable.setShape(GradientDrawable.OVAL);
        
        if (isInfoPressed) {
            infoDrawable.setColor(0xCCFFD700); // Gold when pressed (like flash button)
        } else {
            infoDrawable.setColor(0xCC000000); // Black when unpressed
        }
        infoButton.setBackground(infoDrawable);
    }
    
    private void startRecording() {
        Log.d(TAG, "Starting recording");
        Log.d(TAG, "VideoCapture is null: " + (videoCapture == null));
        Log.d(TAG, "Is recording: " + isRecording);
        
        // Check permissions before starting recording
        if (!allPermissionsGranted()) {
            Log.e(TAG, "Permissions not granted - cannot start recording");
            Toast.makeText(this, "Camera and microphone permissions required", Toast.LENGTH_SHORT).show();
            return;
        }
        
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
        try {
            PendingRecording pendingRecording = videoCapture.getOutput()
                .prepareRecording(this, outputOptions)
                .withAudioEnabled();  // Explicitly enable audio recording
            Log.d(TAG, "PendingRecording created with audio enabled: " + (pendingRecording != null));
                
            Log.d(TAG, "About to start recording");
            Log.d(TAG, "Recording with default audio configuration");
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
                        // Also persist context values if plugin stored them in prefs beforehand
                        // (Optional: plugin can prefill lastContextType/lastMissionId/lastPromptId)
                        editor.putBoolean("shouldNavigateToTest", true);
                        editor.apply();
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to write SharedPreferences: " + e.getMessage());
                    }

                    // Auto-finish and return result to the plugin so React can navigate
                    try {
                        Intent intent = new Intent();
                        
                        // File already has correct name from createVideoFile()
                        String finalVideoPath = videoFile != null ? videoFile.getAbsolutePath() : null;
                        
                        // Debug: Check video file properties
                        if (videoFile != null && videoFile.exists()) {
                            Log.d(TAG, "Video file exists: " + videoFile.getAbsolutePath());
                            Log.d(TAG, "Video file size: " + videoFile.length() + " bytes");
                            
                            // Try to get video metadata
                            try {
                                android.media.MediaMetadataRetriever mmr = new android.media.MediaMetadataRetriever();
                                mmr.setDataSource(videoFile.getAbsolutePath());
                                String duration = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION);
                                String hasAudio = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO);
                                String videoWidth = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH);
                                String videoHeight = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT);
                                mmr.release();
                                
                                Log.d(TAG, "Video duration: " + duration + " ms");
                                Log.d(TAG, "Video has audio: " + hasAudio);
                                Log.d(TAG, "Video resolution: " + videoWidth + "x" + videoHeight);
                            } catch (Exception e) {
                                Log.e(TAG, "Error reading video metadata: " + e.getMessage());
                            }
                        }
                        
                        intent.putExtra("videoUri", finalVideoPath);
                        
                        if (videoFile != null) {
                            String contentUri = FileProvider.getUriForFile(
                                StoryCameraActivity.this,
                                getApplicationContext().getPackageName() + ".fileprovider",
                                videoFile
                            ).toString();
                            intent.putExtra("contentUri", contentUri);
                            
                        }
                        
                        // Pass context back to the plugin
                        if (activityContextType != null) intent.putExtra("contextType", activityContextType);
                        if (activityMissionId != null) intent.putExtra("missionId", activityMissionId);
                        if (activityPromptId != null) intent.putExtra("promptId", activityPromptId);
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
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException during recording: " + e.getMessage());
            Toast.makeText(this, "Permission denied for recording", Toast.LENGTH_SHORT).show();
            return;
        } catch (Exception e) {
            Log.e(TAG, "Exception during recording: " + e.getMessage());
            Toast.makeText(this, "Failed to start recording: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            return;
        }
        
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

        // Recording started - no need for toast
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
        
        // Recording stopped - no need for toast
    }
    
    private File createVideoFile() {
        try {
            // Create a unique filename with timestamp
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName;
            
            // Include context in filename if available
            if (activityContextType != null && activityContextType.equals("mission") && activityMissionId != null) {
                fileName = "MISSION_" + activityMissionId + "_" + timeStamp + ".mp4";
            } else if (activityContextType != null && activityContextType.equals("daily") && activityPromptId != null) {
                fileName = "DAILY_" + activityPromptId + "_" + timeStamp + ".mp4";
            } else {
                fileName = "STORY_" + timeStamp + ".mp4";
            }
            
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
        recordingDrawable.setCornerRadius(25); // Rounded square
        recordingDrawable.setColor(0xFFFF7F5A); // Octo accent fill
        // No stroke to avoid inner orange circle

        // Inset the square inside the button to make it visibly smaller (~20%)
        int insetPx = dpToPx(8); // slightly larger square than before
        InsetDrawable insetDrawable = new InsetDrawable(recordingDrawable, insetPx);
        recordButton.setBackground(insetDrawable);
        // Ensure no elevation/shadow while recording
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                recordButton.setStateListAnimator(null);
            }
            recordButton.setElevation(0f);
            recordButton.setTranslationZ(0f);
        } catch (Exception ignored) {}

        // Subtle scale feedback
        recordButton.setScaleX(0.96f);
        recordButton.setScaleY(0.96f);
        recordButton.animate().scaleX(1f).scaleY(1f).setDuration(180).setInterpolator(new OvershootInterpolator(1.1f)).withEndAction(new Runnable() {
            @Override
            public void run() {
                startPulsingRing();
            }
        }).start();
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
        
        // Background change
        recordButton.setBackground(idleDrawable);
        // Keep elevation disabled to avoid drop shadow
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                recordButton.setStateListAnimator(null);
            }
            recordButton.setElevation(0f);
            recordButton.setTranslationZ(0f);
        } catch (Exception ignored) {}
        
        // Combine animations with bounce effect
        animatorSet.setDuration(200);
        animatorSet.setInterpolator(new BounceInterpolator());
        animatorSet.start();
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
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
            // Check vibrate permission
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.VIBRATE) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Vibrate permission not granted, skipping haptic feedback");
                return;
            }
            
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
    
    private boolean allPermissionsGranted() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Permission not granted: " + permission);
                return false;
            }
        }
        Log.d(TAG, "All permissions granted");
        return true;
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                Log.d(TAG, "Permissions granted, initializing camera");
                // Start camera setup after permissions are confirmed
                try {
                    startCamera();
                } catch (Exception e) {
                    Log.e(TAG, "Error starting camera after permissions granted", e);
                    Toast.makeText(this, "Camera setup failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    setResult(Activity.RESULT_CANCELED);
                    finish();
                }
            } else {
                Log.e(TAG, "Permissions denied, closing camera");
                // Check which specific permissions were denied
                StringBuilder deniedPermissions = new StringBuilder();
                for (int i = 0; i < permissions.length; i++) {
                    if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                        if (deniedPermissions.length() > 0) {
                            deniedPermissions.append(", ");
                        }
                        if (permissions[i].equals(Manifest.permission.CAMERA)) {
                            deniedPermissions.append("Camera");
                        } else if (permissions[i].equals(Manifest.permission.RECORD_AUDIO)) {
                            deniedPermissions.append("Microphone");
                        } else {
                            deniedPermissions.append(permissions[i]);
                        }
                    }
                }
                Toast.makeText(this, "Required permissions denied: " + deniedPermissions.toString() + ". Please enable them in Settings.", Toast.LENGTH_LONG).show();
                setResult(Activity.RESULT_CANCELED);
                finish();
            }
        }
    }
    
    @Override
    public void onBackPressed() {
        Log.d(TAG, "onBackPressed - user cancelled recording");
        // Return cancelled result when user presses back button
        Intent data = new Intent();
        data.putExtra("error", "Recording cancelled by user");
        setResult(Activity.RESULT_CANCELED, data);
        super.onBackPressed();
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
            return Class.forName("com.velyar.app.MainActivity");
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "MainActivity class not found: " + e.getMessage());
            // Fallback to the current activity
            return StoryCameraActivity.class;
        }
    }
}

