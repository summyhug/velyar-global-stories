import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X, Type } from "lucide-react";

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
}

interface VideoTextOverlayProps {
  videoDuration: number;
  onTextOverlaysChange: (overlays: TextOverlay[]) => void;
}

export const VideoTextOverlay = ({ videoDuration, onTextOverlaysChange }: VideoTextOverlayProps) => {
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newText, setNewText] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(2);

  const addTextOverlay = () => {
    if (newText.trim()) {
      const newOverlay: TextOverlay = {
        id: Date.now().toString(),
        text: newText,
        startTime,
        endTime,
        x: 50, // centered
        y: 50  // centered
      };
      
      const updatedOverlays = [...overlays, newOverlay];
      setOverlays(updatedOverlays);
      onTextOverlaysChange(updatedOverlays);
      
      setNewText("");
      setStartTime(0);
      setEndTime(2);
      setShowAddForm(false);
    }
  };

  const removeOverlay = (id: string) => {
    const updatedOverlays = overlays.filter(overlay => overlay.id !== id);
    setOverlays(updatedOverlays);
    onTextOverlaysChange(updatedOverlays);
  };

  return (
    <Card className="border-0 shadow-gentle">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-velyar-earth" />
          <span className="text-sm font-medium text-foreground font-nunito">text overlays</span>
        </div>

        {/* Existing overlays */}
        <div className="space-y-2 mb-3">
          {overlays.map((overlay) => (
            <div key={overlay.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              <div className="flex-1">
                <div className="text-sm font-medium">{overlay.text}</div>
                <div className="text-xs text-muted-foreground">
                  {overlay.startTime}s - {overlay.endTime}s
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOverlay(overlay.id)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new overlay */}
        {showAddForm ? (
          <div className="space-y-3">
            <Input
              placeholder="Enter text overlay..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Start (seconds)</label>
                <Input
                  type="number"
                  min="0"
                  max={videoDuration}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">End (seconds)</label>
                <Input
                  type="number"
                  min="0"
                  max={videoDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addTextOverlay} className="flex-1">
                Add Text
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text Overlay
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
