
import { useState, useRef } from "react";
import { ArrowLeft, Camera, Video, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VideoTextOverlay } from "@/components/VideoTextOverlay";
import { useNavigate } from "react-router-dom";

const VideoCreate = () => {
  const [step, setStep] = useState<'permission' | 'record' | 'upload' | 'edit'>('permission');
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [textOverlays, setTextOverlays] = useState([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      setStream(mediaStream);
      setHasPermission(true);
      setStep('record');
      
      // Show live preview
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Permission denied:', error);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
      setVideoDuration(30); // We'll calculate actual duration later
      setStep('edit');
    };
    
    setRecordedChunks(chunks);
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Stop the live stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      setVideoDuration(30); // Mock duration
      setStep('edit');
    }
  };

  const handleSubmit = () => {
    // Submit video logic
    console.log('Video submitted:', { caption, location, textOverlays });
    navigate('/');
  };

  const handleBack = () => {
    if (step === 'permission') {
      navigate(-1);
    } else if (step === 'record') {
      setStep('permission');
    } else if (step === 'edit') {
      setStep('record');
    }
  };

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2 text-velyar-earth hover:bg-velyar-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-velyar-earth font-nunito">share your story</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-24">
        {step === 'permission' && (
          <div className="mt-8">
            <Card className="text-center border-velyar-earth/10">
              <CardHeader>
                <CardTitle className="text-velyar-earth font-nunito">camera & microphone access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-muted-foreground">
                  to record your story, we need access to your camera and microphone
                </p>
                <Button 
                  onClick={requestPermissions}
                  className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito"
                >
                  allow access
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'record' && (
          <div className="mt-8 space-y-6">
            <Card className="border-velyar-earth/10">
              <CardContent className="p-6">
                <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden mb-4 relative">
                  {stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      REC
                    </div>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!stream}
                    className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-velyar-warm hover:bg-velyar-glow'} text-white`}
                  >
                    {isRecording ? 'stop recording' : 'start recording'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-velyar-earth/10">
              <CardContent className="p-6 text-center">
                <div className="text-velyar-earth font-nunito font-medium mb-2">or upload a video</div>
                <Label htmlFor="video-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-velyar-earth/20 rounded-lg p-6 hover:bg-velyar-soft transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-velyar-earth" />
                    <span className="text-velyar-earth">choose file</span>
                  </div>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'edit' && (
          <div className="mt-8 space-y-6">
            <Card className="border-velyar-earth/10">
              <CardContent className="p-4">
                <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-16 h-16 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-velyar-earth/10">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="caption" className="text-velyar-earth font-nunito">caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="tell us about your story..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-2 border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-velyar-earth font-nunito">location</Label>
                  <Input
                    id="location"
                    placeholder="city, country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
              </CardContent>
            </Card>

            <VideoTextOverlay
              videoDuration={videoDuration}
              onTextOverlaysChange={setTextOverlays}
            />

            <Button 
              onClick={handleSubmit}
              className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium"
            >
              share your story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCreate;
