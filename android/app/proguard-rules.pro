# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# Hide the original source file name
-renamesourcefileattribute SourceFile

# Capacitor specific rules
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class app.lovable.** { *; }

# StoryCamera plugin rules
-keep class app.lovable.velyar.storycamera.** { *; }

# Firebase Analytics rules
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# CameraX rules
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes that might be called from JavaScript
-keep class * extends java.lang.Exception
-keep class * implements java.io.Serializable

# Keep Gson classes if you use JSON serialization
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
