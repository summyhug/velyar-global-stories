
import { ArrowLeft, Video, Camera, RotateCcw, CheckCircle, MapPin, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoTextOverlay } from "@/components/VideoTextOverlay";
import { useState } from "react";

const VideoCreate = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [caption, setCaption] = useState("");
  const [videoDuration, setVideoDuration] = useState(30); // Mock duration
  const [textOverlays, setTextOverlays] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setPermissionsGranted(true);
      stream.getTracks().forEach(track => track.stop()); // Stop the stream for now
    } catch (error) {
      console.error('Permission denied:', error);
    }
  };

  const handleRecord = () => {
    if (!permissionsGranted) {
      requestPermissions();
      return;
    }
    
    setIsRecording(!isRecording);
    if (isRecording) {
      setHasRecorded(true);
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-medium text-foreground font-nunito">share your story</h1>
        </div>
      </header>

      {/* Current Prompt */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <Card className="bg-velyar-glow/20 border-velyar-earth/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">today's prompt</p>
            <h2 className="text-lg font-medium text-foreground font-nunito">
              "what did you eat last night?"
            </h2>
          </CardContent>
        </Card>
      </div>

      {/* Video Recording Area */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <Card className="overflow-hidden border-0 shadow-warm">
          <div className="relative aspect-[9/16] bg-muted flex items-center justify-center">
            {!hasRecorded ? (
              <>
                {/* Camera Preview Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-background/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {permissionsGranted ? 'position yourself in the frame' : 'tap record to grant camera access'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {permissionsGranted ? 'tap the record button when ready' : 'camera and microphone access required'}
                  </p>
                </div>

                {/* AI Framing Helper */}
                {permissionsGranted && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-foreground">good lighting detected</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-foreground">video recorded!</p>
                </div>
              </div>
            )}

            {/* Recording Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              {hasRecorded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => setHasRecorded(false)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                size="lg"
                className={`rounded-full w-16 h-16 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : hasRecorded 
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-velyar-earth hover:bg-velyar-warm'
                }`}
                onClick={handleRecord}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : hasRecorded ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <Video className="w-8 h-8 text-white" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Caption & Details */}
      {hasRecorded && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
          {/* Caption */}
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-velyar-earth" />
                <span className="text-sm font-medium text-foreground font-nunito">add caption</span>
              </div>
              <Textarea
                placeholder="tell us more about your story..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-20 resize-none border-0 bg-muted/50 focus:bg-background"
              />
            </CardContent>
          </Card>

          {/* Text Overlays */}
          <VideoTextOverlay
            videoDuration={videoDuration}
            onTextOverlaysChange={setTextOverlays}
          />

          {/* Location */}
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-velyar-earth" />
                <span className="text-sm font-medium text-foreground font-nunito">location</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>san francisco, california</span>
                <Button variant="ghost" size="sm" className="text-xs ml-auto">
                  change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subtitles */}
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground font-nunito">auto-translate subtitles</h4>
                  <p className="text-xs text-muted-foreground">help others understand your story</p>
                </div>
                <Button variant="outline" size="sm">
                  enable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Share Button */}
          <Button
            size="lg"
            className="w-full bg-gradient-warm text-white font-medium font-nunito mb-24"
          >
            share with the world
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoCreate;
