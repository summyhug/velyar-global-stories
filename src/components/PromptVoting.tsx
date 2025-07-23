import { Vote, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const PromptVoting = () => {
  const prompts = [
    { id: 1, text: "what makes you laugh?", votes: 142 },
    { id: 2, text: "show us your favorite corner of home", votes: 98 },
    { id: 3, text: "what's the view from your window?", votes: 87 },
  ];

  return (
    <Card className="bg-card border-0 shadow-gentle">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Vote className="w-4 h-4 text-velyar-earth" />
          <span className="text-sm text-muted-foreground">choose tomorrow's prompt</span>
          <Clock className="w-3 h-3 text-muted-foreground ml-auto" />
          <span className="text-xs text-muted-foreground">6h left</span>
        </div>
        
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <Button
              key={prompt.id}
              variant="outline"
              className="w-full justify-between h-auto p-4 text-left"
            >
              <span className="text-sm">{prompt.text}</span>
              <span className="text-xs text-muted-foreground">{prompt.votes}</span>
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          voting ends at midnight utc
        </p>
      </CardContent>
    </Card>
  );
};