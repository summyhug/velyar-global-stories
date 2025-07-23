import { MapPin, Eye, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HighlightCardProps {
  title: string;
  location: string;
  author: string;
  views: string;
  imageUrl: string;
}

export const HighlightCard = ({ title, location, author, views, imageUrl }: HighlightCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-gentle hover:shadow-warm transition-all duration-300 cursor-pointer">
      <div className="relative h-32 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-foreground mb-2">{title}</h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{location}</span>
            </div>
            <span>by {author}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{views}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};