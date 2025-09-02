package app.lovable.e717c17b39ea497bb3f0803db35e66f4;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private ValueCallback<Uri[]> mFilePathCallback;
    private String mCameraPhotoPath;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<String> permissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Simple test to see if we can see Android logs
        System.out.println("MainActivity: App started successfully!");
        
        // Configure edge-to-edge layout
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
        
        // Initialize activity result launchers
        fileChooserLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK) {
                    Uri[] results = null;
                    Intent data = result.getData();
                    
                    // Check if response is primary clip (the single clip) or multiple clips
                    if (data != null && data.getClipData() != null) {
                        Uri[] uris = new Uri[data.getClipData().getItemCount()];
                        for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                            uris[i] = data.getClipData().getItemAt(i).getUri();
                        }
                        results = uris;
                    } else if (data != null && data.getData() != null) {
                        // Single file selected
                        results = new Uri[]{data.getData()};
                    }
                    
                    // If camera photo was taken, add it to results
                    if (mCameraPhotoPath != null) {
                        File cameraFile = new File(mCameraPhotoPath);
                        if (cameraFile.exists()) {
                            Uri cameraUri = FileProvider.getUriForFile(
                                this,
                                getPackageName() + ".fileprovider",
                                cameraFile
                            );
                            if (results == null) {
                                results = new Uri[]{cameraUri};
                            } else {
                                Uri[] newResults = new Uri[results.length + 1];
                                System.arraycopy(results, 0, newResults, 0, results.length);
                                newResults[results.length] = cameraUri;
                                results = newResults;
                            }
                        }
                    }
                    
                    if (mFilePathCallback != null) {
                        mFilePathCallback.onReceiveValue(results);
                        mFilePathCallback = null;
                    }
                } else {
                    if (mFilePathCallback != null) {
                        mFilePathCallback.onReceiveValue(null);
                        mFilePathCallback = null;
                    }
                }
                mCameraPhotoPath = null;
            }
        );

        permissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                if (isGranted) {
                    // Permission granted, proceed with file chooser
                    openFileChooser();
                } else {
                    // Permission denied
                    if (mFilePathCallback != null) {
                        mFilePathCallback.onReceiveValue(null);
                        mFilePathCallback = null;
                    }
                }
            }
        );
    }

    @Override
    public void onResume() {
        super.onResume();
        
        // Set custom WebChromeClient to handle file chooser
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                               FileChooserParams fileChooserParams) {
                    
                    // Cancel any existing callback
                    if (mFilePathCallback != null) {
                        mFilePathCallback.onReceiveValue(null);
                    }
                    mFilePathCallback = filePathCallback;

                    // Check camera permission
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) 
                        != PackageManager.PERMISSION_GRANTED) {
                        permissionLauncher.launch(Manifest.permission.CAMERA);
                        return true;
                    }

                    openFileChooser();
                    return true;
                }
            });
        }
    }

    private void openFileChooser() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        Intent takeVideoIntent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
        Intent pickIntent = new Intent(Intent.ACTION_GET_CONTENT);
        pickIntent.addCategory(Intent.CATEGORY_OPENABLE);
        pickIntent.setType("*/*");

        // Create chooser intent
        Intent chooserIntent = Intent.createChooser(pickIntent, "Select Files");
        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{takePictureIntent, takeVideoIntent});

        // Create camera file for photo/video
        File photoFile = null;
        try {
            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String imageFileName = "JPEG_" + timeStamp + "_";
            File storageDir = getExternalFilesDir(null);
            photoFile = File.createTempFile(imageFileName, ".jpg", storageDir);
            mCameraPhotoPath = photoFile.getAbsolutePath();
        } catch (IOException ex) {
            // Error occurred while creating the File
        }

        // Add camera file to intent
        if (photoFile != null) {
            Uri photoURI = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
            takeVideoIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
        }

        fileChooserLauncher.launch(chooserIntent);
    }

    @Override
    public void onDestroy() {
        if (mFilePathCallback != null) {
            mFilePathCallback.onReceiveValue(null);
            mFilePathCallback = null;
        }
        super.onDestroy();
    }
}
