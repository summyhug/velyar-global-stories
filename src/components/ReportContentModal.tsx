import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flag, AlertTriangle } from "lucide-react";
import { reportCategories } from "@/utils/contentModeration";

interface ReportContentModalProps {
  videoId: string;
  children?: React.ReactNode;
}

export const ReportContentModal = ({ videoId, children }: ReportContentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a reason for reporting",
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
          description: "Please log in to report content",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('content_reports')
        .insert({
          video_id: videoId,
          reporter_id: user.user.id,
          reason: reportCategories.find(cat => cat.value === category)?.label || category,
          category: category,
          description: description.trim() || null
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already reported",
            description: "You have already reported this content. Thank you for helping keep our community safe.",
            variant: "destructive",
          });
        } else {
          console.error('Error submitting report:', error);
          toast({
            title: "Error submitting report",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep our community safe. We'll review this content within 24 hours.",
        });
        
        setIsOpen(false);
        setCategory("");
        setDescription("");
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error submitting report",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this content?</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              {reportCategories.map((cat) => (
                <div key={cat.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={cat.value} id={cat.value} className="mt-1" />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor={cat.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cat.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about why you're reporting this content..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Please note:</p>
                <ul className="space-y-1">
                  <li>• Reports are reviewed within 24 hours</li>
                  <li>• False reports may result in account restrictions</li>
                  <li>• Your report will remain anonymous to the content creator</li>
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
              disabled={isSubmitting || !category}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
