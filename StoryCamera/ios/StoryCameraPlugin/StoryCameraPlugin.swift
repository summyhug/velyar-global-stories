import Foundation
import Capacitor
import AVFoundation
import UIKit
import Photos

@objc(StoryCameraPlugin)
public class StoryCameraPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoryCameraPlugin"
    public let jsName = "StoryCamera"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "recordVideo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVideoData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearVideoData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismissCamera", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
    ]
    
    var captureSession: AVCaptureSession?
    var videoOutput: AVCaptureMovieFileOutput?
    var previewLayer: AVCaptureVideoPreviewLayer?
    var currentCamera: AVCaptureDevice?
    var isRecording = false
    var maxDuration: TimeInterval = 30.0
    private var allowOverlays = true
    private var appliedOverlays: [String] = []
    private var videoFileURL: URL?
    private var thumbnailFileURL: URL?
    var savedRecordVideoCall: CAPPluginCall?
    private weak var cameraViewController: StoryCameraViewController?

    // ========================================
    // VIDEO SEGMENT TRACKING - Pause/Resume Implementation
    // ========================================
    // iOS's AVCaptureMovieFileOutput doesn't natively support pause/resume like Android's CameraX.
    // We implement pause/resume using a segment-based approach:
    //
    // HOW IT WORKS:
    // 1. START: Begin recording to segment_0.mp4
    // 2. PAUSE: Stop recording segment_0, save URL to videoSegments array
    // 3. RESUME: Start recording to segment_1.mp4 (segment_0 stays in array)
    // 4. PAUSE: Stop recording segment_1, add to videoSegments array (now has 2 segments)
    // 5. STOP: Merge all segments using AVMutableComposition + AVAssetExportSession
    //
    // TECHNICAL DETAILS:
    // - Each segment is a separate .mp4 file saved to Documents directory
    // - Segments maintain orientation via AVVideoComposition transforms
    // - Merging is seamless - no visible cuts in final video
    // - Temporary segment files are cleaned up after merge
    // - If no pauses occurred, only 1 segment exists - no merge needed
    //
    // FLAGS:
    // - isPausedStop: Distinguishes pause-stop (save segment) from final-stop (merge segments)
    // ========================================
    private var videoSegments: [URL] = []
    private var currentSegmentIndex = 0
    private var isPausedStop = false // Flag to distinguish pause-stop from final-stop
    
    public override func load() {
        super.load()
    }
    
    @objc func recordVideo(_ call: CAPPluginCall) {
        print("📹 StoryCamera: recordVideo called")
        
        // CRITICAL: Clean up any previous recording before starting a new one
        cleanupPreviousRecording(rejectPendingCall: true)
        
        let duration = call.getInt("duration") ?? 30
        let camera = call.getString("camera") ?? "rear"
        let overlays = call.getBool("allowOverlays") ?? true
        
        print("📹 StoryCamera: Options - duration: \(duration), camera: \(camera), overlays: \(overlays)")
        
        maxDuration = TimeInterval(duration)
        allowOverlays = overlays
        appliedOverlays.removeAll()

        // Store the call for later resolution
        savedRecordVideoCall = call
        
        // Check camera permission
        let cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
        print("📹 StoryCamera: Camera permission status: \(cameraStatus.rawValue)")
        
        switch cameraStatus {
        case .authorized:
            print("📹 StoryCamera: Camera authorized, starting camera")
            startCamera(call: call, camera: camera)
        case .notDetermined:
            print("📹 StoryCamera: Camera permission not determined, requesting...")
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                print("📹 StoryCamera: Camera permission request result: \(granted)")
                if granted {
                    DispatchQueue.main.async {
                        self?.startCamera(call: call, camera: camera)
                    }
                } else {
                    print("❌ StoryCamera: Camera permission denied")
                    call.reject("Camera permission denied")
                }
            }
        case .denied, .restricted:
            print("❌ StoryCamera: Camera permission denied or restricted")
            call.reject("Camera permission required")
        @unknown default:
            print("❌ StoryCamera: Unknown camera permission status")
            call.reject("Unknown camera permission status")
        }
    }
    
    private func cleanupPreviousRecording(rejectPendingCall: Bool = false) {
        print("📹 StoryCamera: cleanupPreviousRecording called (rejectPendingCall: \(rejectPendingCall))")
        
        // Stop any ongoing recording
        if isRecording {
            print("📹 StoryCamera: Stopping ongoing recording during cleanup")
            videoOutput?.stopRecording()
            isRecording = false
        }
        
        // Dismiss camera view controller if present
        if let cameraVC = cameraViewController {
            print("📹 StoryCamera: Dismissing previous camera view controller")
            DispatchQueue.main.async { [weak self] in
                cameraVC.dismiss(animated: false) {
                    self?.cameraViewController = nil
                }
            }
        }
        
        // Stop and clean up capture session (must be done on session queue)
        if let session = captureSession {
            print("📹 StoryCamera: Stopping previous capture session")
            let sessionQueue = DispatchQueue(label: "storyCamera.sessionQueue")
            sessionQueue.sync {
                if session.isRunning {
                    session.stopRunning()
                }
                // Remove all inputs and outputs
                for input in session.inputs {
                    session.removeInput(input)
                }
                for output in session.outputs {
                    session.removeOutput(output)
                }
            }
            captureSession = nil
        }
        
        // Clean up video output
        videoOutput = nil
        currentCamera = nil
        
        // Delete any existing video files
        if let url = videoFileURL {
            try? FileManager.default.removeItem(at: url)
            videoFileURL = nil
        }
        if let url = thumbnailFileURL {
            try? FileManager.default.removeItem(at: url)
            thumbnailFileURL = nil
        }
        
        // Reject pending call if requested
        if rejectPendingCall, let call = savedRecordVideoCall {
            print("📹 StoryCamera: Rejecting pending call during cleanup")
            call.reject("New recording started, previous recording cancelled")
            savedRecordVideoCall = nil
        }
    }
    
    private func startCamera(call: CAPPluginCall, camera: String) {
        print("📹 StoryCamera: startCamera called with camera: \(camera)")
        
        captureSession = AVCaptureSession()
        
        guard let captureSession = captureSession else {
            print("❌ StoryCamera: Failed to create capture session")
            call.reject("Failed to create capture session")
            return
        }
        
        // Configure video quality
        captureSession.sessionPreset = .high
        print("📹 StoryCamera: Capture session created with preset: high")
        
        // Set up camera input
        let cameraPosition: AVCaptureDevice.Position = camera == "front" ? .front : .back
        guard let cameraDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: cameraPosition) else {
            print("❌ StoryCamera: Camera device not available for position: \(cameraPosition == .front ? "front" : "back")")
            call.reject("Camera not available")
            return
        }
        
        print("📹 StoryCamera: Camera device found: \(cameraDevice.localizedName)")
        currentCamera = cameraDevice
        
        do {
            let cameraInput = try AVCaptureDeviceInput(device: cameraDevice)
            if captureSession.canAddInput(cameraInput) {
                captureSession.addInput(cameraInput)
                print("📹 StoryCamera: Camera input added successfully")
            } else {
                print("❌ StoryCamera: Cannot add camera input")
                call.reject("Cannot add camera input")
                return
            }
        } catch {
            print("❌ StoryCamera: Failed to create camera input: \(error.localizedDescription)")
            call.reject("Failed to create camera input: \(error.localizedDescription)")
            return
        }
        
        // Set up audio input - request permission if needed
        print("📹 StoryCamera: Checking microphone permission...")
        let microphoneStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        print("📹 StoryCamera: Microphone permission status: \(microphoneStatus.rawValue)")
        
        // Request microphone permission if not determined
        if microphoneStatus == .notDetermined {
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                print("📹 StoryCamera: Microphone permission request result: \(granted)")
                if granted {
                    DispatchQueue.main.async { [weak self] in
                        self?.addAudioInput(to: captureSession)
                    }
                } else {
                    print("⚠️ StoryCamera: Microphone permission denied (continuing without audio)")
                }
            }
        } else if microphoneStatus == .authorized {
            // Permission already granted, add audio input
            addAudioInput(to: captureSession)
        } else {
            print("⚠️ StoryCamera: Microphone permission denied or restricted (continuing without audio)")
        }
        
        // Set up video output
        videoOutput = AVCaptureMovieFileOutput()
        guard let videoOutput = videoOutput else {
            print("❌ StoryCamera: Failed to create video output")
            call.reject("Failed to create video output")
            return
        }
        
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
            print("📹 StoryCamera: Video output added successfully")
        } else {
            print("❌ StoryCamera: Cannot add video output")
            call.reject("Cannot add video output")
            return
        }
        
        // Start capture session on background queue
        print("📹 StoryCamera: Starting capture session...")
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            captureSession.startRunning()
            print("📹 StoryCamera: Capture session started")
            
            DispatchQueue.main.async {
                self?.presentCameraInterface(call: call)
            }
        }
    }
    
    private func addAudioInput(to captureSession: AVCaptureSession) {
        guard let audioDevice = AVCaptureDevice.default(for: .audio) else {
            print("⚠️ StoryCamera: Audio device not available")
            return
        }
        
        do {
            let audioInput = try AVCaptureDeviceInput(device: audioDevice)
            if captureSession.canAddInput(audioInput) {
                captureSession.addInput(audioInput)
                print("📹 StoryCamera: Audio input added successfully")
            } else {
                print("⚠️ StoryCamera: Cannot add audio input to session")
            }
        } catch {
            print("⚠️ StoryCamera: Failed to create audio input: \(error.localizedDescription)")
        }
    }
    
    private func presentCameraInterface(call: CAPPluginCall) {
        print("📹 StoryCamera: Presenting camera interface")
        
        // Create camera view controller
        let cameraVC = StoryCameraViewController()
        cameraVC.plugin = self
        cameraVC.call = call
        
        // Store reference to camera view controller for later dismissal
        self.cameraViewController = cameraVC
        
        // Pass context data to view controller
        cameraVC.promptName = call.getString("promptName")
        cameraVC.contextType = call.getString("contextType")
        cameraVC.missionId = call.getString("missionId")
        cameraVC.promptId = call.getString("promptId")
        
        // Present camera interface
        guard let viewController = self.bridge?.viewController else {
            print("❌ StoryCamera: View controller not available")
            call.reject("View controller not available")
            return
        }
        
        DispatchQueue.main.async {
            viewController.present(cameraVC, animated: true) {
                print("📹 StoryCamera: Camera interface presented")
            }
        }
    }
    
    @objc func startRecording(_ call: CAPPluginCall) {
        startRecording(call: call)
    }

    func startRecordingFromUI() {
        startRecording(call: nil)
    }

    private func startRecording(call: CAPPluginCall?) {
        guard let videoOutput = videoOutput, !isRecording else {
            call?.reject("Already recording or video output not available")
            return
        }

        // Initialize segments for new recording
        videoSegments = []
        currentSegmentIndex = 0

        // Create temporary file URL for first segment
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let videoName = "video_segment_0_\(Date().timeIntervalSince1970).mp4"
        videoFileURL = documentsPath.appendingPathComponent(videoName)

        guard let videoFileURL = videoFileURL else {
            call?.reject("Failed to create video file URL")
            return
        }

        // Start recording
        videoOutput.startRecording(to: videoFileURL, recordingDelegate: self)
        isRecording = true

        // Set up timer for max duration
        DispatchQueue.main.asyncAfter(deadline: .now() + maxDuration) { [weak self] in
            guard let self = self, self.isRecording else { return }
            self.videoOutput?.stopRecording()
            self.isRecording = false
        }

        call?.resolve()
    }
    
    @objc func stopRecording(_ call: CAPPluginCall) {
        stopRecording(call: call)
    }
    
    func stopRecordingFromUI() {
        stopRecording(call: nil)
    }

    // Finalize recording when paused (merge segments without stopping new recording)
    func finalizePausedRecordingFromUI() {
        print("📹 StoryCamera: 🏁 FINALIZE paused recording")
        print("📹 StoryCamera: Current segments in array: \(videoSegments.count)")

        // If we have segments, merge and process them
        if videoSegments.count > 1 {
            print("📹 StoryCamera: ✅ Merging \(videoSegments.count) paused segments:")
            for (index, segment) in videoSegments.enumerated() {
                print("📹 StoryCamera:   Segment \(index): \(segment.lastPathComponent)")
            }
            mergeVideoSegments(segments: videoSegments) { [weak self] mergedURL in
                guard let self = self else { return }
                if let mergedURL = mergedURL {
                    print("📹 StoryCamera: Segments merged successfully")
                    self.processRecordedVideo(url: mergedURL)
                    // Clean up segment files
                    self.cleanupSegments()
                } else {
                    print("❌ StoryCamera: Failed to merge segments")
                    if let call = self.savedRecordVideoCall {
                        call.reject("Failed to merge video segments")
                        self.savedRecordVideoCall = nil
                    }
                }
            }
        } else if videoSegments.count == 1 {
            // Only one segment, process it directly (no merge needed)
            print("📹 StoryCamera: ✅ Single paused segment detected")
            print("📹 StoryCamera: Skipping merge, processing directly: \(videoSegments[0].lastPathComponent)")
            print("📹 StoryCamera: This happens when user records → pause → stop (without resume)")
            processRecordedVideo(url: videoSegments[0])
            // DON'T clean up the segment - it IS the final video!
            // Only reset the array to prepare for next recording
            videoSegments = []
            currentSegmentIndex = 0
        } else {
            print("❌ StoryCamera: No segments to finalize!")
        }
    }

    private func stopRecording(call: CAPPluginCall?) {
        guard isRecording else {
            call?.reject("Not recording")
            return
        }

        print("📹 StoryCamera: ⏹️ STOP requested")
        print("📹 StoryCamera: isPausedStop = \(isPausedStop) (should be false for final stop)")
        print("📹 StoryCamera: Current segments in array: \(videoSegments.count)")
        videoOutput?.stopRecording()
        isRecording = false
        print("📹 StoryCamera: Called videoOutput.stopRecording() - waiting for delegate callback")
        call?.resolve()
    }

    // Pause recording by stopping current segment
    func pauseRecordingFromUI() {
        guard let videoOutput = videoOutput, isRecording else {
            print("📹 StoryCamera: Cannot pause - not recording")
            return
        }

        print("📹 StoryCamera: ⏸️ PAUSE requested")
        print("📹 StoryCamera: Setting isPausedStop = true")
        print("📹 StoryCamera: Current segments in array: \(videoSegments.count)")
        isPausedStop = true
        videoOutput.stopRecording()
        print("📹 StoryCamera: Called videoOutput.stopRecording() - waiting for delegate callback")
        // Note: isRecording will be set to false in fileOutput delegate
        // The segment will be saved in the delegate method
    }

    // Resume recording by starting a new segment
    func resumeRecordingFromUI() {
        guard let videoOutput = videoOutput, !isRecording else {
            print("📹 StoryCamera: Cannot resume - already recording")
            return
        }

        print("📹 StoryCamera: ▶️ RESUME requested")
        print("📹 StoryCamera: isPausedStop = \(isPausedStop) (should be false)")
        print("📹 StoryCamera: Current segments in array: \(videoSegments.count)")

        // Create new segment file URL
        currentSegmentIndex += 1
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let segmentName = "video_segment_\(currentSegmentIndex)_\(Date().timeIntervalSince1970).mp4"
        let segmentURL = documentsPath.appendingPathComponent(segmentName)

        print("📹 StoryCamera: Creating segment \(currentSegmentIndex): \(segmentName)")
        videoFileURL = segmentURL

        // Start recording new segment
        videoOutput.startRecording(to: segmentURL, recordingDelegate: self)
        isRecording = true
        print("📹 StoryCamera: Recording resumed to new segment")
    }

    @objc func switchCamera(_ call: CAPPluginCall) {
        switchCamera(call: call)
    }
    
    func switchCameraFromUI() {
        switchCamera(call: nil)
    }
    
    private func switchCamera(call: CAPPluginCall?) {
        guard let captureSession = captureSession else {
            call?.reject("Capture session not available")
            return
        }
        
        // Remove current camera input
        if let currentInput = captureSession.inputs.first(where: { $0 is AVCaptureDeviceInput }) as? AVCaptureDeviceInput {
            captureSession.removeInput(currentInput)
        }
        
        // Switch camera position
        let newPosition: AVCaptureDevice.Position = currentCamera?.position == .back ? .front : .back
        guard let newCamera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: newPosition) else {
            call?.reject("Camera not available")
            return
        }
        
        currentCamera = newCamera
        
        do {
            let newInput = try AVCaptureDeviceInput(device: newCamera)
            if captureSession.canAddInput(newInput) {
                captureSession.addInput(newInput)
                call?.resolve()
            } else {
                call?.reject("Cannot add new camera input")
            }
        } catch {
            call?.reject("Failed to switch camera: \(error.localizedDescription)")
        }
    }
    
    @objc func addOverlay(_ call: CAPPluginCall) {
        guard allowOverlays else {
            call.reject("Overlays not allowed")
            return
        }
        
        let overlayType = call.getString("type") ?? "text"
        let overlayData = call.getString("data") ?? ""
        
        appliedOverlays.append("\(overlayType):\(overlayData)")
        call.resolve()
    }
    
    @objc func cancelRecording(_ call: CAPPluginCall) {
        cancelRecording(call: call)
    }
    
    func cancelRecordingFromUI() {
        cancelRecording(call: nil)
    }
    
    private func cancelRecording(call: CAPPluginCall?) {
        print("📹 StoryCamera: cancelRecording called")
        
        if isRecording {
            videoOutput?.stopRecording()
            isRecording = false
        }
        
        // Clean up files
        if let videoFileURL = videoFileURL {
            try? FileManager.default.removeItem(at: videoFileURL)
        }
        if let thumbnailFileURL = thumbnailFileURL {
            try? FileManager.default.removeItem(at: thumbnailFileURL)
        }
        
        // Clear saved call reference
        if savedRecordVideoCall != nil {
            savedRecordVideoCall = nil
        }
        
        call?.resolve()
    }
    
    @objc func getVideoData(_ call: CAPPluginCall) {
        print("📹 StoryCamera: ===== getVideoData called =====")

        // Check if we have a video file
        if let videoFileURL = videoFileURL, FileManager.default.fileExists(atPath: videoFileURL.path) {
            print("📹 StoryCamera: ✅ Returning hasVideo=true, filePath=\(videoFileURL.path)")
            call.resolve([
                "hasVideo": true,
                "filePath": videoFileURL.path
            ])
        } else {
            print("📹 StoryCamera: ❌ No video file, returning hasVideo=false")
            call.resolve(["hasVideo": false])
        }
    }
    
    @objc func clearVideoData(_ call: CAPPluginCall) {
        print("📹 StoryCamera: ===== clearVideoData called =====")
        print("📹 StoryCamera: Current videoFileURL: \(videoFileURL?.path ?? "nil")")
        print("📹 StoryCamera: Current thumbnailFileURL: \(thumbnailFileURL?.path ?? "nil")")
        
        // Delete video file if it exists
        if let url = videoFileURL {
            print("📹 StoryCamera: Attempting to delete video file: \(url.path)")
            do {
                try FileManager.default.removeItem(at: url)
                print("📹 StoryCamera: ✅ Video file deleted successfully")
            } catch {
                print("⚠️ StoryCamera: ❌ Failed to delete video file: \(error.localizedDescription)")
            }
        } else {
            print("📹 StoryCamera: No videoFileURL to delete")
        }
        videoFileURL = nil
        print("📹 StoryCamera: videoFileURL set to nil")
        
        // Delete thumbnail file if it exists
        if let url = thumbnailFileURL {
            print("📹 StoryCamera: Attempting to delete thumbnail file: \(url.path)")
            do {
                try FileManager.default.removeItem(at: url)
                print("📹 StoryCamera: ✅ Thumbnail file deleted successfully")
            } catch {
                print("⚠️ StoryCamera: ❌ Failed to delete thumbnail file: \(error.localizedDescription)")
            }
        } else {
            print("📹 StoryCamera: No thumbnailFileURL to delete")
        }
        thumbnailFileURL = nil
        print("📹 StoryCamera: thumbnailFileURL set to nil")
        
        // Clear saved call reference
        savedRecordVideoCall = nil
        print("📹 StoryCamera: savedRecordVideoCall cleared")

        print("📹 StoryCamera: ===== clearVideoData finished =====")
        call.resolve()
    }

    @objc func dismissCamera(_ call: CAPPluginCall) {
        print("📹 StoryCamera: ===== dismissCamera called =====")

        // Dismiss the camera view controller if it's present
        if let cameraVC = cameraViewController {
            print("📹 StoryCamera: Dismissing camera view controller")
            DispatchQueue.main.async { [weak self] in
                cameraVC.dismiss(animated: true) {
                    print("📹 StoryCamera: Camera view controller dismissed successfully")
                    self?.cameraViewController = nil

                    // Ensure webview becomes active again after dismissal
                    if let bridge = self?.bridge, let webView = bridge.webView {
                        webView.becomeFirstResponder()
                    }

                    call.resolve()
                }
            }
        } else {
            print("📹 StoryCamera: No camera view controller to dismiss")
            call.resolve()
        }
    }

    @objc func ping(_ call: CAPPluginCall) {
        print("📹 StoryCamera: ping called")
        call.resolve()
    }
    
    private func processRecordedVideo(url: URL) {
        print("📹 StoryCamera: Processing recorded video at: \(url.path)")
        
        // Check file size and compress if needed
        let fileSize = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
        let maxSize: Int64 = 50 * 1024 * 1024 // 50MB
        
        let finalVideoURL = fileSize > maxSize ? compressVideo(url) : url
        
        // Generate thumbnail
        let thumbnailURL = generateThumbnail(from: finalVideoURL)
        
        // Get video metadata
        let metadata = getVideoMetadata(from: finalVideoURL)
        
        // Create result
        var result: [String: Any] = [
            "filePath": finalVideoURL.path,
            "thumbnailPath": thumbnailURL.path,
            "duration": metadata.duration,
            "size": (try? finalVideoURL.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0,
            "camera": currentCamera?.position == .front ? "front" : "rear",
            "overlays": appliedOverlays
        ]
        
        // Add context data if available
        if let call = savedRecordVideoCall {
            if let contextType = call.getString("contextType") {
                result["contextType"] = contextType
            }
            if let missionId = call.getString("missionId") {
                result["missionId"] = missionId
            }
            if let promptId = call.getString("promptId") {
                result["promptId"] = promptId
            }
        }
        
        print("📹 StoryCamera: Video processed successfully, resolving call")
        print("📹 StoryCamera: Result - filePath: \(result["filePath"] ?? "nil"), duration: \(metadata.duration)")
        
        // Resolve the original call using the stored reference
        if let call = savedRecordVideoCall {
            call.resolve(result)
            savedRecordVideoCall = nil
            print("📹 StoryCamera: Call resolved successfully")

            // Auto-dismiss the camera after resolving (like Android finishing activity)
            // Dismiss immediately so VideoPreview becomes visible
            DispatchQueue.main.async { [weak self] in
                guard let self = self, let cameraVC = self.cameraViewController else {
                    print("📹 StoryCamera: No camera VC to dismiss")
                    return
                }

                print("📹 StoryCamera: Auto-dismissing camera modal")
                cameraVC.dismiss(animated: true) {
                    print("📹 StoryCamera: Camera modal dismissed - VideoPreview should now be visible")
                    self.cameraViewController = nil

                    // Ensure webview becomes active again
                    if let bridge = self.bridge, let webView = bridge.webView {
                        webView.becomeFirstResponder()
                    }
                }
            }
        } else {
            print("❌ StoryCamera: No saved call found to resolve")
        }
    }
    
    private func compressVideo(_ url: URL) -> URL {
        // For now, return the original URL
        // In a real implementation, you would use AVAssetExportSession for compression
        return url
    }
    
    private func generateThumbnail(from url: URL) -> URL {
        let asset = AVAsset(url: url)
        let imageGenerator = AVAssetImageGenerator(asset: asset)
        imageGenerator.appliesPreferredTrackTransform = true
        
        let time = CMTime(seconds: 1.0, preferredTimescale: 1)
        
        do {
            let cgImage = try imageGenerator.copyCGImage(at: time, actualTime: nil)
            let thumbnail = UIImage(cgImage: cgImage)
            
            // Save thumbnail
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let thumbnailName = "thumb_\(Date().timeIntervalSince1970).jpg"
            let thumbnailURL = documentsPath.appendingPathComponent(thumbnailName)
            
            if let data = thumbnail.jpegData(compressionQuality: 0.8) {
                try data.write(to: thumbnailURL)
                thumbnailFileURL = thumbnailURL
                return thumbnailURL
            }
        } catch {
            print("Failed to generate thumbnail: \(error)")
        }
        
        // Return a placeholder URL if thumbnail generation fails
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent("thumb_placeholder.jpg")
    }
    
    private func getVideoMetadata(from url: URL) -> (duration: Double, width: Int, height: Int) {
        let asset = AVAsset(url: url)
        let duration = CMTimeGetSeconds(asset.duration)

        let tracks = asset.tracks(withMediaType: .video)
        let videoTrack = tracks.first
        let size = videoTrack?.naturalSize ?? CGSize.zero

        return (duration, Int(size.width), Int(size.height))
    }
}

// MARK: - AVCaptureFileOutputRecordingDelegate
extension StoryCameraPlugin: AVCaptureFileOutputRecordingDelegate {
    public func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        isRecording = false

        if let error = error {
            print("❌ StoryCamera: Recording failed: \(error.localizedDescription)")
            if let call = savedRecordVideoCall {
                call.reject("Recording failed: \(error.localizedDescription)")
                savedRecordVideoCall = nil
            }
            // Dismiss camera view controller on error
            DispatchQueue.main.async { [weak self] in
                self?.cameraViewController?.dismiss(animated: true) {
                    print("📹 StoryCamera: Camera view controller dismissed after error")
                    self?.cameraViewController = nil
                }
            }
            return
        }

        print("📹 StoryCamera: Recording segment finished successfully: \(outputFileURL.lastPathComponent)")
        print("📹 StoryCamera: Current segments before append: \(videoSegments.map { $0.lastPathComponent })")

        // Add segment to array
        videoSegments.append(outputFileURL)
        print("📹 StoryCamera: Segment added. Total segments: \(videoSegments.count)")
        print("📹 StoryCamera: All segments: \(videoSegments.map { $0.lastPathComponent })")

        // If this was a pause-stop, just save the segment and return (waiting for resume)
        if isPausedStop {
            print("📹 StoryCamera: This was a PAUSE-STOP. Saving segment and waiting for resume.")
            print("📹 StoryCamera: isPausedStop will be reset to false")
            isPausedStop = false
            // Notify UI that pause completed
            DispatchQueue.main.async { [weak self] in
                self?.cameraViewController?.pauseRecordingCompleted()
            }
            return
        }

        // This is a final stop - merge all segments if needed
        print("📹 StoryCamera: This was a FINAL-STOP. Checking if merge is needed...")
        print("📹 StoryCamera: videoSegments.count = \(videoSegments.count)")
        if videoSegments.count > 1 {
            print("📹 StoryCamera: ✅ Merging \(videoSegments.count) segments:")
            for (index, segment) in videoSegments.enumerated() {
                print("📹 StoryCamera:   Segment \(index): \(segment.lastPathComponent)")
            }
            mergeVideoSegments(segments: videoSegments) { [weak self] mergedURL in
                guard let self = self else { return }
                if let mergedURL = mergedURL {
                    print("📹 StoryCamera: Segments merged successfully")
                    self.processRecordedVideo(url: mergedURL)
                    // Clean up segment files
                    self.cleanupSegments()
                } else {
                    print("❌ StoryCamera: Failed to merge segments")
                    if let call = self.savedRecordVideoCall {
                        call.reject("Failed to merge video segments")
                        self.savedRecordVideoCall = nil
                    }
                }
            }
        } else {
            // Only one segment, process it directly
            print("📹 StoryCamera: Single segment, processing directly")
            processRecordedVideo(url: outputFileURL)
        }
    }

    private func cleanupSegments() {
        // ========================================
        // CLEANUP SEGMENTS - Called ONLY after merging
        // ========================================
        // This deletes temporary segment files after they've been merged.
        // Should NOT be called when processing a single segment directly,
        // as that segment IS the final video file.
        // ========================================
        print("📹 StoryCamera: Cleaning up \(videoSegments.count) temporary segment files")
        for segmentURL in videoSegments {
            print("📹 StoryCamera: Deleting: \(segmentURL.lastPathComponent)")
            try? FileManager.default.removeItem(at: segmentURL)
        }
        videoSegments = []
        currentSegmentIndex = 0
    }

    private func mergeVideoSegments(segments: [URL], completion: @escaping (URL?) -> Void) {
        print("📹 StoryCamera: 🎬 mergeVideoSegments called with \(segments.count) segments")

        guard segments.count > 1 else {
            print("📹 StoryCamera: ⚠️ Only \(segments.count) segment(s), returning first segment without merge")
            completion(segments.first)
            return
        }

        print("📹 StoryCamera: Creating AVMutableComposition for merging...")
        let mixComposition = AVMutableComposition()
        guard let videoTrack = mixComposition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
              let audioTrack = mixComposition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
            print("❌ StoryCamera: Failed to create composition tracks")
            completion(nil)
            return
        }

        print("📹 StoryCamera: Composition tracks created successfully")
        var insertTime = CMTime.zero
        var videoSize = CGSize.zero
        var videoTransform = CGAffineTransform.identity

        for (index, segmentURL) in segments.enumerated() {
            print("📹 StoryCamera: Processing segment \(index): \(segmentURL.lastPathComponent)")
            let asset = AVAsset(url: segmentURL)

            do {
                // Add video track
                if let assetVideoTrack = asset.tracks(withMediaType: .video).first {
                    // Capture transform and size from first segment
                    if index == 0 {
                        videoTransform = assetVideoTrack.preferredTransform
                        videoSize = assetVideoTrack.naturalSize
                        print("📹 StoryCamera: Video transform: \(videoTransform)")
                        print("📹 StoryCamera: Natural size: \(videoSize)")
                    }

                    try videoTrack.insertTimeRange(
                        CMTimeRange(start: .zero, duration: asset.duration),
                        of: assetVideoTrack,
                        at: insertTime
                    )
                }

                // Add audio track
                if let assetAudioTrack = asset.tracks(withMediaType: .audio).first {
                    try audioTrack.insertTimeRange(
                        CMTimeRange(start: .zero, duration: asset.duration),
                        of: assetAudioTrack,
                        at: insertTime
                    )
                }

                insertTime = CMTimeAdd(insertTime, asset.duration)
            } catch {
                print("❌ StoryCamera: Error adding segment: \(error)")
                completion(nil)
                return
            }
        }

        // Apply the transform to maintain orientation
        videoTrack.preferredTransform = videoTransform

        // Calculate proper render size based on transform
        let renderSize: CGSize
        let angle = atan2(videoTransform.b, videoTransform.a)
        let isPortrait = abs(angle - .pi / 2) < 0.1 || abs(angle + .pi / 2) < 0.1
        if isPortrait {
            // For portrait videos, swap width and height
            renderSize = CGSize(width: videoSize.height, height: videoSize.width)
            print("📹 StoryCamera: Portrait video detected, render size: \(renderSize)")
        } else {
            renderSize = videoSize
            print("📹 StoryCamera: Landscape video, render size: \(renderSize)")
        }

        // Create video composition to apply the transform
        let videoComposition = AVMutableVideoComposition()
        videoComposition.renderSize = renderSize
        videoComposition.frameDuration = CMTime(value: 1, timescale: 30) // 30 fps

        let instruction = AVMutableVideoCompositionInstruction()
        instruction.timeRange = CMTimeRange(start: .zero, duration: mixComposition.duration)

        let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
        layerInstruction.setTransform(videoTransform, at: .zero)

        instruction.layerInstructions = [layerInstruction]
        videoComposition.instructions = [instruction]

        // Export merged video
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let mergedVideoURL = documentsPath.appendingPathComponent("merged_video_\(Date().timeIntervalSince1970).mp4")

        // Remove file if it exists
        try? FileManager.default.removeItem(at: mergedVideoURL)

        guard let exporter = AVAssetExportSession(asset: mixComposition, presetName: AVAssetExportPresetHighestQuality) else {
            print("❌ StoryCamera: Failed to create export session")
            completion(nil)
            return
        }

        exporter.outputURL = mergedVideoURL
        exporter.outputFileType = .mp4
        exporter.shouldOptimizeForNetworkUse = true
        exporter.videoComposition = videoComposition // Apply the video composition

        print("📹 StoryCamera: Starting async export...")
        exporter.exportAsynchronously {
            DispatchQueue.main.async {
                switch exporter.status {
                case .completed:
                    print("✅ StoryCamera: Video segments merged successfully!")
                    print("📹 StoryCamera: Merged video URL: \(mergedVideoURL.lastPathComponent)")
                    completion(mergedVideoURL)
                case .failed:
                    print("❌ StoryCamera: Export failed: \(exporter.error?.localizedDescription ?? "unknown error")")
                    completion(nil)
                case .cancelled:
                    print("❌ StoryCamera: Export cancelled")
                    completion(nil)
                default:
                    print("❌ StoryCamera: Export ended with unknown status: \(exporter.status.rawValue)")
                    completion(nil)
                }
            }
        }
    }
}

// MARK: - Camera View Controller
class StoryCameraViewController: UIViewController {
    weak var plugin: StoryCameraPlugin?
    weak var call: CAPPluginCall?
    
    private var previewView: UIView!
    private var recordButton: UIButton!
    private var recordButtonContainer: UIView!
    private var recordButtonOuterRing: UIView!
    private var pulsingRing: UIView!
    private var switchCameraButton: UIButton!
    private var switchCameraButtonLeadingConstraint: NSLayoutConstraint!
    private var cancelButton: UIButton!
    private var infoButton: UIButton!
    private var pauseButton: UIButton!
    private var flashButton: UIButton!
    private var promptLabel: UILabel!
    private var countdownLabel: UILabel!
    private var recordTimer: Timer?
    private var recordingStartTime: Date?
    private var pausedTime: TimeInterval = 0
    private var totalPausedTime: TimeInterval = 0
    private var maxDuration: TimeInterval = 30.0
    private var isPaused: Bool = false
    
    // Context properties
    var promptName: String?
    var contextType: String?
    var missionId: String?
    var promptId: String?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        view.backgroundColor = UIColor.black
        
        // Preview view
        previewView = UIView()
        previewView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(previewView)
        
        // Pulsing ring behind record button
        pulsingRing = UIView()
        pulsingRing.backgroundColor = UIColor.clear
        pulsingRing.layer.borderColor = UIColor(red: 1.0, green: 0.5, blue: 0.35, alpha: 1.0).cgColor
        pulsingRing.layer.borderWidth = 8
        pulsingRing.layer.cornerRadius = 60
        pulsingRing.alpha = 0
        pulsingRing.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(pulsingRing)
        
        // Record button container (for ring design: orange outline, transparent gap, filled center)
        recordButtonContainer = UIView()
        recordButtonContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(recordButtonContainer)
        
        // Outer orange ring (outline)
        recordButtonOuterRing = UIView()
        recordButtonOuterRing.backgroundColor = UIColor.clear
        recordButtonOuterRing.layer.borderColor = UIColor(red: 1.0, green: 0.5, blue: 0.35, alpha: 1.0).cgColor
        recordButtonOuterRing.layer.borderWidth = 3
        recordButtonOuterRing.layer.cornerRadius = 40
        recordButtonOuterRing.translatesAutoresizingMaskIntoConstraints = false
        recordButtonContainer.addSubview(recordButtonOuterRing)
        
        // Inner filled orange circle (center)
        recordButton = UIButton(type: .custom)
        recordButton.backgroundColor = UIColor(red: 1.0, green: 0.5, blue: 0.35, alpha: 1.0) // Orange color #FF7F5A
        recordButton.layer.cornerRadius = 28 // Smaller inner circle
        recordButton.translatesAutoresizingMaskIntoConstraints = false
        recordButton.addTarget(self, action: #selector(recordButtonTapped), for: .touchUpInside)
        recordButtonContainer.addSubview(recordButton)
        
        // Setup record button container constraints
        NSLayoutConstraint.activate([
            recordButtonOuterRing.widthAnchor.constraint(equalToConstant: 80),
            recordButtonOuterRing.heightAnchor.constraint(equalToConstant: 80),
            recordButtonOuterRing.centerXAnchor.constraint(equalTo: recordButtonContainer.centerXAnchor),
            recordButtonOuterRing.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor),
            
            recordButton.widthAnchor.constraint(equalToConstant: 56),
            recordButton.heightAnchor.constraint(equalToConstant: 56),
            recordButton.centerXAnchor.constraint(equalTo: recordButtonContainer.centerXAnchor),
            recordButton.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor)
        ])
        
        // Switch camera button (smaller, fitted size ~40dp)
        switchCameraButton = UIButton(type: .system)
        switchCameraButton.setImage(UIImage(systemName: "arrow.triangle.2.circlepath.camera.fill"), for: .normal)
        switchCameraButton.tintColor = .white
        switchCameraButton.backgroundColor = UIColor.black.withAlphaComponent(0.8) // Match Android 0xCC000000
        switchCameraButton.layer.cornerRadius = 20
        switchCameraButton.contentMode = .center
        switchCameraButton.imageView?.contentMode = .scaleAspectFit
        switchCameraButton.translatesAutoresizingMaskIntoConstraints = false
        switchCameraButton.addTarget(self, action: #selector(switchCameraTapped), for: .touchUpInside)
        view.addSubview(switchCameraButton)
        
        // Cancel button (smaller, fitted size ~40dp)
        cancelButton = UIButton(type: .system)
        cancelButton.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
        cancelButton.tintColor = .white
        cancelButton.backgroundColor = UIColor.black.withAlphaComponent(0.8) // Match Android 0xCC000000
        cancelButton.layer.cornerRadius = 20
        cancelButton.contentMode = .center
        cancelButton.imageView?.contentMode = .scaleAspectFit
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelButton)

        // Flash button (top right, smaller fitted size ~40dp)
        flashButton = UIButton(type: .system)
        flashButton.setImage(UIImage(systemName: "bolt.slash.fill"), for: .normal)
        flashButton.tintColor = .white
        flashButton.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        flashButton.layer.cornerRadius = 20
        flashButton.contentMode = .center
        flashButton.imageView?.contentMode = .scaleAspectFit
        flashButton.translatesAutoresizingMaskIntoConstraints = false
        flashButton.addTarget(self, action: #selector(flashButtonTapped), for: .touchUpInside)
        view.addSubview(flashButton)

        // Info button (smaller, fitted size ~40dp)
        infoButton = UIButton(type: .system)
        infoButton.setImage(UIImage(systemName: "info.circle.fill"), for: .normal)
        infoButton.tintColor = .white
        infoButton.backgroundColor = UIColor.black.withAlphaComponent(0.8) // Match Android 0xCC000000
        infoButton.layer.cornerRadius = 20
        infoButton.contentMode = .center
        infoButton.imageView?.contentMode = .scaleAspectFit
        infoButton.translatesAutoresizingMaskIntoConstraints = false
        infoButton.addTarget(self, action: #selector(infoButtonTapped), for: .touchUpInside)
        view.addSubview(infoButton)
        
        // Pause/Resume button (appears when recording, hidden initially)
        pauseButton = UIButton(type: .system)
        pauseButton.setImage(UIImage(systemName: "pause.fill"), for: .normal)
        pauseButton.tintColor = .white
        pauseButton.backgroundColor = UIColor.black.withAlphaComponent(0.8) // Match Android 0xCC000000
        pauseButton.layer.cornerRadius = 20
        pauseButton.contentMode = .center
        pauseButton.imageView?.contentMode = .scaleAspectFit
        pauseButton.translatesAutoresizingMaskIntoConstraints = false
        pauseButton.alpha = 0
        pauseButton.isHidden = true
        pauseButton.addTarget(self, action: #selector(pauseButtonTapped), for: .touchUpInside)
        view.addSubview(pauseButton)
        
        // Countdown timer label (top center)
        countdownLabel = UILabel()
        countdownLabel.textColor = .white
        countdownLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 16, weight: .medium)
        countdownLabel.textAlignment = .center
        countdownLabel.text = ""
        countdownLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(countdownLabel)
        
        // Prompt label (above record button)
        promptLabel = UILabel()
        promptLabel.textColor = .white
        promptLabel.font = UIFont.boldSystemFont(ofSize: 14)
        promptLabel.textAlignment = .center
        promptLabel.numberOfLines = 4
        promptLabel.lineBreakMode = .byTruncatingTail
        promptLabel.isHidden = true
        promptLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(promptLabel)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            previewView.topAnchor.constraint(equalTo: view.topAnchor),
            previewView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            previewView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            previewView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            pulsingRing.centerXAnchor.constraint(equalTo: recordButtonContainer.centerXAnchor),
            pulsingRing.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor),
            pulsingRing.widthAnchor.constraint(equalToConstant: 120),
            pulsingRing.heightAnchor.constraint(equalToConstant: 120),
            
            recordButtonContainer.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            recordButtonContainer.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),
            recordButtonContainer.widthAnchor.constraint(equalToConstant: 80),
            recordButtonContainer.heightAnchor.constraint(equalToConstant: 80),

            // Close button - closer to left and higher up
            cancelButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            cancelButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            cancelButton.widthAnchor.constraint(equalToConstant: 40),
            cancelButton.heightAnchor.constraint(equalToConstant: 40),

            // Flash button - top right corner
            flashButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            flashButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            flashButton.widthAnchor.constraint(equalToConstant: 40),
            flashButton.heightAnchor.constraint(equalToConstant: 40),
            
            // Info button - centered horizontally with record button, to the left
            infoButton.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor),
            infoButton.trailingAnchor.constraint(equalTo: recordButtonContainer.leadingAnchor, constant: -30),
            infoButton.widthAnchor.constraint(equalToConstant: 40),
            infoButton.heightAnchor.constraint(equalToConstant: 40),
            
            // Pause button - appears directly to the right of record button when recording
            pauseButton.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor),
            pauseButton.leadingAnchor.constraint(equalTo: recordButtonContainer.trailingAnchor, constant: 30),
            pauseButton.widthAnchor.constraint(equalToConstant: 40),
            pauseButton.heightAnchor.constraint(equalToConstant: 40),
            
            // Switch camera button - initially to the right of record button, shifts right when recording
            switchCameraButton.centerYAnchor.constraint(equalTo: recordButtonContainer.centerYAnchor),
            switchCameraButton.widthAnchor.constraint(equalToConstant: 40),
            switchCameraButton.heightAnchor.constraint(equalToConstant: 40),
            
            countdownLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            countdownLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 70),
            
            promptLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            promptLabel.bottomAnchor.constraint(equalTo: recordButtonContainer.topAnchor, constant: -20),
            promptLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            promptLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20)
        ])
        
        // Create and store switch camera button leading constraint (starts at record button, shifts to pause button when recording)
        switchCameraButtonLeadingConstraint = switchCameraButton.leadingAnchor.constraint(equalTo: recordButtonContainer.trailingAnchor, constant: 30)
        switchCameraButtonLeadingConstraint.isActive = true
        
        // Setup preview layer
        if let captureSession = plugin?.captureSession {
            let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
            previewLayer.videoGravity = AVLayerVideoGravity.resizeAspectFill
            previewLayer.frame = previewView.bounds
            previewView.layer.addSublayer(previewLayer)
            plugin?.previewLayer = previewLayer
        }
        
        // Set max duration from plugin
        maxDuration = plugin?.maxDuration ?? 30.0
        
        // Set up prompt text if available
        if let promptName = promptName, !promptName.isEmpty {
            promptLabel.text = promptName
            promptLabel.isHidden = false
        }

        // Set initial flash button visibility based on camera capabilities
        if let device = plugin?.currentCamera {
            let hasFlash = device.hasTorch && device.isTorchAvailable
            flashButton.isHidden = !hasFlash
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        plugin?.previewLayer?.frame = previewView.bounds
        
        // Ensure icons are properly centered and sized
        configureButtonIcons()
    }
    
    private func configureButtonIcons() {
        // Configure switch camera button icon
        if let imageView = switchCameraButton.imageView {
            imageView.contentMode = .scaleAspectFit
            // Center the icon within the button
            switchCameraButton.contentVerticalAlignment = .center
            switchCameraButton.contentHorizontalAlignment = .center
        }
        
        // Configure cancel button icon
        if let imageView = cancelButton.imageView {
            imageView.contentMode = .scaleAspectFit
            cancelButton.contentVerticalAlignment = .center
            cancelButton.contentHorizontalAlignment = .center
        }
        
        // Configure info button icon
        if let imageView = infoButton.imageView {
            imageView.contentMode = .scaleAspectFit
            infoButton.contentVerticalAlignment = .center
            infoButton.contentHorizontalAlignment = .center
        }

        // Configure flash button icon
        if let imageView = flashButton.imageView {
            imageView.contentMode = .scaleAspectFit
            flashButton.contentVerticalAlignment = .center
            flashButton.contentHorizontalAlignment = .center
        }
    }
    
    @objc private func recordButtonTapped() {
        guard let plugin = plugin else { return }

        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()

        // ========================================
        // RECORD BUTTON UX - OPTION B
        // ========================================
        // This implements "Option B" where the record button serves as both start and stop:
        //
        // IDLE STATE (not recording, not paused):
        //   - Record button shows as circle (red/orange)
        //   - Tap → START recording
        //
        // RECORDING STATE (plugin.isRecording = true):
        //   - Record button shows as rounded square (visual feedback)
        //   - Pause button is visible for pause/resume
        //   - Tap record button → STOP and finalize
        //
        // PAUSED STATE (plugin.isRecording = false, isPaused = true):
        //   - Record button still shows as rounded square
        //   - Pause button shows play icon for resume
        //   - Tap record button → STOP and finalize (merge segments)
        //   - Tap pause button → RESUME recording
        //
        // ALTERNATIVE APPROACHES (for future reference):
        // - Option A: Hide record button when recording/paused (pause button only)
        // - Option C: Long press on pause button to finalize, single tap to pause/resume
        // ========================================

        if plugin.isRecording || isPaused {
            // Currently recording OR paused → STOP and finalize
            print("📹 StoryCamera UI: Record button → STOP (isRecording: \(plugin.isRecording), isPaused: \(isPaused))")
            stopRecording()
        } else {
            // Idle → START new recording
            print("📹 StoryCamera UI: Record button → START")
            startRecording()
        }
    }
    
    private func startRecording() {
        guard let plugin = plugin else { return }
        
        plugin.startRecordingFromUI()
        recordingStartTime = Date()
        totalPausedTime = 0
        isPaused = false
        
        // Start pulsing animation
        startPulsingAnimation()
        
        // Start countdown timer
        startCountdownTimer()
        
        // Show pause button with fade in
        showPauseButton()
        
        // Animate button morph to rounded square (like Android)
        animateToRecordingState()
    }
    
    private func showPauseButton() {
        pauseButton.isHidden = false
        
        // Shift switch camera button to the right to make room for pause button
        // Pause button: record.trailing + 30, width 48, so ends at record.trailing + 78
        // Switch camera should start at pause end + spacing = record.trailing + 78 + 20 = 98
        switchCameraButtonLeadingConstraint.constant = 98 // 30 (pause position) + 48 (pause width) + 20 (spacing)
        
        UIView.animate(withDuration: 0.3) {
            self.pauseButton.alpha = 1.0
            self.view.layoutIfNeeded() // Animate constraint change
        }
    }
    
    private func hidePauseButton() {
        // Shift switch camera button back to its original position
        switchCameraButtonLeadingConstraint.constant = 30
        
        UIView.animate(withDuration: 0.2, animations: {
            self.pauseButton.alpha = 0
            self.view.layoutIfNeeded() // Animate constraint change
        }) { _ in
            self.pauseButton.isHidden = true
        }
    }
    
    private func animateToRecordingState() {
        // Scale down slightly
        recordButtonContainer.transform = CGAffineTransform(scaleX: 0.96, y: 0.96)
        
        // Morph to rounded square
        UIView.animate(withDuration: 0.18, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: [], animations: {
            self.recordButtonContainer.transform = .identity
            
            // Hide outer ring
            self.recordButtonOuterRing.alpha = 0
            
            // Change inner button to rounded square
            self.recordButton.layer.cornerRadius = 12 // Rounded square
            self.recordButton.transform = CGAffineTransform(scaleX: 0.85, y: 0.85) // Slightly smaller square
        }, completion: nil)
    }
    
    private func stopRecording() {
        guard let plugin = plugin else { return }

        // ========================================
        // STOP RECORDING LOGIC - OPTION B
        // ========================================
        // This method is called when the user wants to finalize and stop recording.
        // It handles two different states:
        //
        // STATE 1: Recording is active (plugin.isRecording = true)
        //   - Call stopRecordingFromUI() to stop the current recording segment
        //   - If no pauses occurred, this is the only segment
        //   - If pauses occurred, this stops the last segment and triggers merge
        //
        // STATE 2: Recording is paused (isPaused = true, plugin.isRecording = false)
        //   - Call finalizePausedRecordingFromUI() to merge existing segments
        //   - No need to stop recording (already stopped when pause was pressed)
        //   - Segments are already saved, just need to merge and process
        //
        // After either path, we:
        //   - Stop visual feedback (pulsing, timer)
        //   - Hide pause button
        //   - Reset UI to idle state
        // ========================================

        if isPaused {
            // STATE 2: Paused - merge existing segments
            print("📹 StoryCamera UI: Stopping from PAUSED state → finalizing segments")
            plugin.finalizePausedRecordingFromUI()
        } else {
            // STATE 1: Recording - stop current segment (will trigger merge if segments exist)
            print("📹 StoryCamera UI: Stopping from RECORDING state → stopping segment")
            plugin.stopRecordingFromUI()
        }

        // Stop pulsing animation
        stopPulsingAnimation()

        // Stop countdown timer
        stopCountdownTimer()

        // Hide pause button
        hidePauseButton()

        // Reset pause state
        isPaused = false
        totalPausedTime = 0

        // Animate back to circle (idle state)
        animateToIdleState()
    }
    
    private func animateToIdleState() {
        // Morph back to circle
        UIView.animate(withDuration: 0.2, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: [], animations: {
            // Restore outer ring
            self.recordButtonOuterRing.alpha = 1.0
            
            // Change back to circle
            self.recordButton.layer.cornerRadius = 28 // Back to circle
            self.recordButton.transform = .identity
            
            // Reset container transform
            self.recordButtonContainer.transform = .identity
        }, completion: nil)
    }
    
    private func startPulsingAnimation() {
        let pulse = CABasicAnimation(keyPath: "transform.scale")
        pulse.duration = 1.0
        pulse.fromValue = 1.0
        pulse.toValue = 1.2
        pulse.autoreverses = true
        pulse.repeatCount = .infinity
        
        let opacity = CABasicAnimation(keyPath: "opacity")
        opacity.duration = 1.0
        opacity.fromValue = 0.8
        opacity.toValue = 0.3
        opacity.autoreverses = true
        opacity.repeatCount = .infinity
        
        pulsingRing.alpha = 0.8
        pulsingRing.layer.add(pulse, forKey: "pulse")
        pulsingRing.layer.add(opacity, forKey: "opacity")
    }
    
    private func stopPulsingAnimation() {
        pulsingRing.layer.removeAllAnimations()
        UIView.animate(withDuration: 0.3) {
            self.pulsingRing.alpha = 0
        }
    }
    
    private func startCountdownTimer() {
        countdownLabel.text = formatTime(maxDuration)
        
        recordTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
            guard let self = self,
                  let startTime = self.recordingStartTime,
                  let plugin = self.plugin else {
                timer.invalidate()
                return
            }
            
            // Skip timer update if paused
            if self.isPaused {
                return
            }
            
            let elapsed = Date().timeIntervalSince(startTime) - self.totalPausedTime
            let remaining = max(0, self.maxDuration - elapsed)
            
            if remaining > 0 {
                self.countdownLabel.text = self.formatTime(remaining)
                
                // Auto-stop at max duration
                if elapsed >= self.maxDuration {
                    if plugin.isRecording {
                        self.stopRecording()
                    }
                }
            } else {
                self.stopCountdownTimer()
                self.countdownLabel.text = "00:00"
            }
        }
    }
    
    private func stopCountdownTimer() {
        recordTimer?.invalidate()
        recordTimer = nil
        recordingStartTime = nil
        countdownLabel.text = ""
    }
    
    private func formatTime(_ seconds: TimeInterval) -> String {
        let totalSeconds = Int(seconds)
        let minutes = totalSeconds / 60
        let secs = totalSeconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
    
    @objc private func switchCameraTapped() {
        plugin?.switchCameraFromUI()

        // Update flash button visibility based on camera capabilities
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let device = self.plugin?.currentCamera {
                let hasFlash = device.hasTorch && device.isTorchAvailable
                self.flashButton.isHidden = !hasFlash

                // Turn off torch if switching away from back camera
                if device.torchMode != .off {
                    do {
                        try device.lockForConfiguration()
                        device.torchMode = .off
                        device.unlockForConfiguration()
                        self.flashButton.setImage(UIImage(systemName: "bolt.slash.fill"), for: .normal)
                    } catch {
                        print("📹 StoryCamera: Error turning off torch: \(error)")
                    }
                }
            }
        }
    }

    @objc private func flashButtonTapped() {
        guard let device = plugin?.currentCamera else { return }
        guard device.hasTorch && device.isTorchAvailable else { return }

        do {
            try device.lockForConfiguration()

            if device.torchMode == .off {
                try device.setTorchModeOn(level: 1.0)
                flashButton.setImage(UIImage(systemName: "bolt.fill"), for: .normal)
            } else {
                device.torchMode = .off
                flashButton.setImage(UIImage(systemName: "bolt.slash.fill"), for: .normal)
            }

            device.unlockForConfiguration()
        } catch {
            print("📹 StoryCamera: Error toggling torch: \(error)")
        }
    }

    @objc private func cancelTapped() {
        print("📹 StoryCamera: Cancel tapped")
        stopCountdownTimer()
        stopPulsingAnimation()
        plugin?.cancelRecordingFromUI()
        if let plugin = plugin, let savedCall = plugin.savedRecordVideoCall {
            savedCall.reject("User cancelled recording")
            plugin.savedRecordVideoCall = nil
        }
        dismiss(animated: true)
    }
    
    @objc private func infoButtonTapped() {
        guard let promptName = promptName, !promptName.isEmpty else { return }
        
        UIView.animate(withDuration: 0.3) {
            self.promptLabel.isHidden.toggle()
        }
    }
    
    @objc private func pauseButtonTapped() {
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()

        // ========================================
        // PAUSE BUTTON UX - OPTION B
        // ========================================
        // The pause button handles pause/resume ONLY (not finalization)
        // Record button is used to finalize/stop recording
        //
        // When actively recording:
        //   - Shows pause icon
        //   - Tap → PAUSE (stops current segment, saves it)
        //
        // When paused:
        //   - Shows play icon with gold background
        //   - Tap → RESUME (starts new segment)
        //
        // To finalize recording in either state, user taps the RECORD button
        // ========================================

        if isPaused {
            resumeRecording()
        } else {
            pauseRecording()
        }
    }

    private func pauseRecording() {
        guard let plugin = plugin, plugin.isRecording, !isPaused else { return }

        // ========================================
        // PAUSE RECORDING - Stops current segment and saves it
        // ========================================
        // Flow:
        // 1. Set isPaused flag to track UI state
        // 2. Record when pause started (for timer calculation)
        // 3. Call plugin.pauseRecordingFromUI() to stop current segment
        // 4. Plugin stops recording, saves segment to array
        // 5. Plugin calls pauseRecordingCompleted() when done
        // 6. UI updates (play icon, gold background, stop animation)
        // ========================================

        print("📹 StoryCamera UI: Pausing recording")
        isPaused = true
        pausedTime = Date().timeIntervalSince1970

        // Call plugin to stop current segment
        plugin.pauseRecordingFromUI()

        // UI updates will be done in pauseRecordingCompleted()
    }

    func pauseRecordingCompleted() {
        print("📹 StoryCamera UI: Pause completed, updating UI")

        // Update button to show play icon
        pauseButton.setImage(UIImage(systemName: "play.fill"), for: .normal)

        // Change background to gold when paused (like Android)
        pauseButton.backgroundColor = UIColor(red: 1.0, green: 0.843, blue: 0.0, alpha: 0.8) // Gold #FFD700

        // Stop pulsing ring animation
        stopPulsingAnimation()
    }

    private func resumeRecording() {
        guard let plugin = plugin, !plugin.isRecording, isPaused else { return }

        // ========================================
        // RESUME RECORDING - Starts new segment
        // ========================================
        // Flow:
        // 1. Clear isPaused flag
        // 2. Calculate how long we were paused (for accurate timer)
        // 3. Update UI (pause icon, black background, restart animation)
        // 4. Call plugin.resumeRecordingFromUI() to start new segment
        // 5. Plugin starts recording to new file (segment array keeps previous segments)
        // ========================================

        print("📹 StoryCamera UI: Resuming recording")
        isPaused = false

        // Calculate paused duration and add to total
        if pausedTime > 0 {
            let pausedDuration = Date().timeIntervalSince1970 - pausedTime
            totalPausedTime += pausedDuration
            pausedTime = 0
        }

        // Update button back to pause icon
        pauseButton.setImage(UIImage(systemName: "pause.fill"), for: .normal)

        // Restore background to black
        pauseButton.backgroundColor = UIColor.black.withAlphaComponent(0.8)

        // Restart pulsing ring animation
        startPulsingAnimation()

        // Call plugin to start new segment
        plugin.resumeRecordingFromUI()
    }
    
    deinit {
        stopCountdownTimer()
        stopPulsingAnimation()
    }
}
