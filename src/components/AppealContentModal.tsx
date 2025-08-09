import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Info } from "lucide-react";

interface AppealContentModalProps {
  videoId: string;
  removalReason?: string;
  children?: React.ReactNode;
}

export const AppealContentModal = ({ videoId, removalReason, children }: AppealContentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      toast({
        title: "Appeal reason required",
        description: "Please explain why you believe this decision should be reversed",
        variant: "destructive",
      });
      return;
    }

    if (appealReason.trim().length < 20) {
      toast({
        title: "Appeal too short",
        description: "Please provide at least 20 characters explaining your appeal",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit an appeal",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if user owns this video
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        toast({
          title: "Video not found",
          description: "Unable to find the video to appeal",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (video.user_id !== user.user.id) {
        toast({
          title: "Not authorized",
          description: "You can only appeal your own content",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if appeal already exists
      const { data: existingAppeal } = await supabase
        .from('content_appeals')
        .select('id, status')
        .eq('video_id', videoId)
        .eq('user_id', user.user.id)
        .single();

      if (existingAppeal) {
        const statusText = existingAppeal.status === 'pending' ? 'pending review' : existingAppeal.status;
        toast({
          title: "Appeal already submitted",
          description: `You have already submitted an appeal for this content. Status: ${statusText}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('content_appeals')
        .insert({
          video_id: videoId,
          user_id: user.user.id,
          appeal_reason: appealReason.trim()
        });

      if (error) {
        console.error('Error submitting appeal:', error);
        toast({
          title: "Error submitting appeal",
          description: "Please try again later",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Appeal submitted",
          description: "Your appeal has been submitted and will be reviewed within 48 hours. You'll receive an email notification with the decision.",
        });
        
        setIsOpen(false);
        setAppealReason("");
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast({
        title: "Error submitting appeal",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAppealReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
            <MessageSquare className="w-4 h-4 mr-1" />
            Appeal Decision
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Appeal Content Decision
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {removalReason && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Content was flagged for:</p>
                  <p className="text-sm text-destructive/80">{removalReason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="appealReason" className="text-sm font-medium">
              Why do you believe this decision should be reversed? *
            </Label>
            <Textarea
              id="appealReason"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Please explain why you believe your content was incorrectly flagged or removed. Be specific about why you think it follows our community guidelines..."
              className="min-h-[120px] resize-none"
              required
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {appealReason.length}/1000 characters
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-2">Appeal Process:</p>
                <ul className="space-y-1">
                  <li>• Appeals are reviewed by human moderators within 48 hours</li>
                  <li>• You can only submit one appeal per piece of content</li>
                  <li>• Decisions are based on our community guidelines</li>
                  <li>• You'll receive an email notification with the decision</li>
                  <li>• If approved, your content will be restored immediately</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || appealReason.trim().length < 20}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Appeal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
