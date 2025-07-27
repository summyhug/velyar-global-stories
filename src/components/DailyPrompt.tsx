
import { ArrowRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export const DailyPrompt = () => {
  return (
    <Card className="mt-6 bg-gradient-soft border-0 shadow-gentle">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-velyar-earth" />
          <span className="text-sm text-muted-foreground">today's global prompt</span>
        </div>
        
        <h2 className="text-xl font-medium text-foreground mb-4 leading-relaxed font-nunito">
          "what did you eat last night?"
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          join 2,847 voices from 94 countries sharing their evening meals
        </p>
        
        <div className="flex gap-3">
          <Link to="/create" className="flex-1">
            <Button 
              className="w-full bg-velyar-earth hover:bg-velyar-warm transition-colors"
              size="lg"
            >
              share
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/videos/daily-prompt" className="flex-1">
            <Button 
              variant="outline"
              className="w-full"
              size="lg"
            >
              view
              <Eye className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
