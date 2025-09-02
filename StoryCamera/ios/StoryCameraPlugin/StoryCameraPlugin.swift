import Foundation
import Capacitor
import AVFoundation
import UIKit
import Photos

@objc(StoryCameraPlugin)
public class StoryCameraPlugin: CAPPlugin {
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureMovieFileOutput?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var currentCamera: AVCaptureDevice?
    private var isRecording = false
    private var maxDuration: TimeInterval = 30.0
    private var allowOverlays = true
    private var appliedOverlays: [String] = []
    private var videoFileURL: URL?
    private var thumbnailFileURL: URL?
    
    @objc func recordVideo(_ call: CAPPluginCall) {
        let duration = call.getInt("duration") ?? 30
        let camera = call.getString("camera") ?? "rear"
        let overlays = call.getBool("allowOverlays") ?? true
        
        maxDuration = TimeInterval(duration)
        allowOverlays = overlays
        appliedOverlays.removeAll()
        
        // Check camera permission
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            startCamera(call: call, camera: camera)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    DispatchQueue.main.async {
                        self?.startCamera(call: call, camera: camera)
                    }
                } else {
                    call.reject("Camera permission denied")
                }
            }
        case .denied, .restricted:
            call.reject("Camera permission required")
        @unknown default:
            call.reject("Unknown camera permission status")
        }
    }
    
    private func startCamera(call: CAPPluginCall, camera: String) {
        captureSession = AVCaptureSession()
        
        guard let captureSession = captureSession else {
            call.reject("Failed to create capture session")
            return
        }
        
        // Configure video quality
        captureSession.sessionPreset = .high
        
        // Set up camera input
        let cameraPosition: AVCaptureDevice.Position = camera == "front" ? .front : .back
        guard let cameraDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: cameraPosition) else {
            call.reject("Camera not available")
            return
        }
        
        currentCamera = cameraDevice
        
        do {
            let cameraInput = try AVCaptureDeviceInput(device: cameraDevice)
            if captureSession.canAddInput(cameraInput) {
                captureSession.addInput(cameraInput)
            } else {
                call.reject("Cannot add camera input")
                return
            }
        } catch {
            call.reject("Failed to create camera input: \(error.localizedDescription)")
            return
        }
        
        // Set up audio input
        guard let audioDevice = AVCaptureDevice.default(for: .audio) else {
            call.reject("Audio device not available")
            return
        }
        
        do {
            let audioInput = try AVCaptureDeviceInput(device: audioDevice)
            if captureSession.canAddInput(audioInput) {
                captureSession.addInput(audioInput)
            }
        } catch {
            call.reject("Failed to create audio input: \(error.localizedDescription)")
            return
        }
        
        // Set up video output
        videoOutput = AVCaptureMovieFileOutput()
        guard let videoOutput = videoOutput else {
            call.reject("Failed to create video output")
            return
        }
        
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        } else {
            call.reject("Cannot add video output")
            return
        }
        
        // Start capture session on background queue
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            captureSession.startRunning()
            
            DispatchQueue.main.async {
                self?.presentCameraInterface(call: call)
            }
        }
    }
    
    private func presentCameraInterface(call: CAPPluginCall) {
        // Create camera view controller
        let cameraVC = StoryCameraViewController()
        cameraVC.plugin = self
        cameraVC.call = call
        
        // Present camera interface
        DispatchQueue.main.async {
            self.bridge?.viewController?.present(cameraVC, animated: true)
        }
    }
    
    @objc func startRecording(_ call: CAPPluginCall) {
        guard let videoOutput = videoOutput, !isRecording else {
            call.reject("Already recording or video output not available")
            return
        }
        
        // Create temporary file URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let videoName = "video_\(Date().timeIntervalSince1970).mp4"
        videoFileURL = documentsPath.appendingPathComponent(videoName)
        
        guard let videoFileURL = videoFileURL else {
            call.reject("Failed to create video file URL")
            return
        }
        
        // Start recording
        videoOutput.startRecording(to: videoFileURL, recordingDelegate: self)
        isRecording = true
        
        // Set up timer for max duration
        DispatchQueue.main.asyncAfter(deadline: .now() + maxDuration) { [weak self] in
            self?.stopRecording()
        }
        
        call.resolve()
    }
    
    @objc func stopRecording(_ call: CAPPluginCall) {
        guard isRecording else {
            call.reject("Not recording")
            return
        }
        
        videoOutput?.stopRecording()
        isRecording = false
        call.resolve()
    }
    
    @objc func switchCamera(_ call: CAPPluginCall) {
        guard let captureSession = captureSession else {
            call.reject("Capture session not available")
            return
        }
        
        // Remove current camera input
        if let currentInput = captureSession.inputs.first(where: { $0 is AVCaptureDeviceInput }) as? AVCaptureDeviceInput {
            captureSession.removeInput(currentInput)
        }
        
        // Switch camera position
        let newPosition: AVCaptureDevice.Position = currentCamera?.position == .back ? .front : .back
        guard let newCamera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: newPosition) else {
            call.reject("Camera not available")
            return
        }
        
        currentCamera = newCamera
        
        do {
            let newInput = try AVCaptureDeviceInput(device: newCamera)
            if captureSession.canAddInput(newInput) {
                captureSession.addInput(newInput)
                call.resolve()
            } else {
                call.reject("Cannot add new camera input")
            }
        } catch {
            call.reject("Failed to switch camera: \(error.localizedDescription)")
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
        
        call.resolve()
    }
    
    private func processRecordedVideo(url: URL) {
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
        
        // Resolve the original call
        if let call = bridge?.getSavedCall("recordVideo") {
            call.resolve(result)
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
        
        let tracks = try? asset.tracks(withMediaType: .video)
        let videoTrack = tracks?.first
        let size = videoTrack?.naturalSize ?? CGSize.zero
        
        return (duration, Int(size.width), Int(size.height))
    }
}

// MARK: - AVCaptureFileOutputRecordingDelegate
extension StoryCameraPlugin: AVCaptureFileOutputRecordingDelegate {
    public func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        isRecording = false
        
        if let error = error {
            print("Recording failed: \(error)")
            if let call = bridge?.getSavedCall("recordVideo") {
                call.reject("Recording failed: \(error.localizedDescription)")
            }
            return
        }
        
        processRecordedVideo(url: outputFileURL)
    }
}

// MARK: - Camera View Controller
class StoryCameraViewController: UIViewController {
    weak var plugin: StoryCameraPlugin?
    weak var call: CAPPluginCall?
    
    private var previewView: UIView!
    private var recordButton: UIButton!
    private var switchCameraButton: UIButton!
    private var cancelButton: UIButton!
    
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
        
        // Record button
        recordButton = UIButton(type: .custom)
        recordButton.backgroundColor = UIColor.white
        recordButton.layer.cornerRadius = 40
        recordButton.layer.borderWidth = 4
        recordButton.layer.borderColor = UIColor.white.cgColor
        recordButton.translatesAutoresizingMaskIntoConstraints = false
        recordButton.addTarget(self, action: #selector(recordButtonTapped), for: .touchUpInside)
        view.addSubview(recordButton)
        
        // Switch camera button
        switchCameraButton = UIButton(type: .system)
        switchCameraButton.setTitle("Switch", for: .normal)
        switchCameraButton.setTitleColor(.white, for: .normal)
        switchCameraButton.translatesAutoresizingMaskIntoConstraints = false
        switchCameraButton.addTarget(self, action: #selector(switchCameraTapped), for: .touchUpInside)
        view.addSubview(switchCameraButton)
        
        // Cancel button
        cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelButton)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            previewView.topAnchor.constraint(equalTo: view.topAnchor),
            previewView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            previewView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            previewView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            recordButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            recordButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            recordButton.widthAnchor.constraint(equalToConstant: 80),
            recordButton.heightAnchor.constraint(equalToConstant: 80),
            
            switchCameraButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            switchCameraButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            cancelButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            cancelButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20)
        ])
        
        // Setup preview layer
        if let captureSession = plugin?.captureSession {
            let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
            previewLayer.videoGravity = .resizeAspectFill
            previewLayer.frame = previewView.bounds
            previewView.layer.addSublayer(previewLayer)
            plugin?.previewLayer = previewLayer
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        plugin?.previewLayer?.frame = previewView.bounds
    }
    
    @objc private func recordButtonTapped() {
        if plugin?.isRecording == true {
            plugin?.stopRecording(CAPPluginCall(callbackId: "stopRecording", options: [:], success: { _ in }, error: { _ in }))
        } else {
            plugin?.startRecording(CAPPluginCall(callbackId: "startRecording", options: [:], success: { _ in }, error: { _ in }))
        }
    }
    
    @objc private func switchCameraTapped() {
        plugin?.switchCamera(CAPPluginCall(callbackId: "switchCamera", options: [:], success: { _ in }, error: { _ in }))
    }
    
    @objc private func cancelTapped() {
        plugin?.cancelRecording(CAPPluginCall(callbackId: "cancelRecording", options: [:], success: { _ in }, error: { _ in }))
        dismiss(animated: true)
    }
}
