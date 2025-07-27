
import { MapPin, Users2, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface MissionCardProps {
  title: string;
  description: string;
  participants: number;
  location: string;
  imageUrl: string;
}

export const MissionCard = ({ title, description, participants, location, imageUrl }: MissionCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-gentle hover:shadow-warm transition-all duration-300">
      <div className="relative h-24 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 text-white">
          <h3 className="font-medium text-sm font-nunito">{title}</h3>
        </div>
      </div>
      
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users2 className="w-3 h-3" />
            <span>{participants.toLocaleString()} voices</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-velyar-earth">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link to="/create" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              join mission
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </Link>
          <Link to={`/videos/mission/${title.replace(/\s+/g, '-')}`}>
            <Button variant="ghost" size="sm" className="px-3">
              <Eye className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
