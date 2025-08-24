
import { MapPin, Users2, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface MissionCardProps {
  id: string;
  title: string;
  description: string;
  participants: number;
  location: string;
  imageUrl: string;
  targetRegions?: string[];
}

export const MissionCard = ({ id, title, description, participants, location, imageUrl, targetRegions }: MissionCardProps) => {
  const displayLocation = targetRegions && targetRegions.length > 0 
    ? `${targetRegions.slice(0, 2).join(', ')}${targetRegions.length > 2 ? '...' : ''}`
    : location;

  return (
    <Card className="card-interactive group overflow-hidden border-border/50 hover:border-velyar-warm/30">
      <CardContent className="p-0">
        <div className="flex min-h-40">
          {/* Full left side image */}
          <div className="relative w-1/3 overflow-hidden flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Content section */}
          <div className="flex-1 p-4 space-y-3">
            {/* Header with title and badge */}
            <div className="flex items-start justify-between">
              <h3 className="text-base font-display text-foreground leading-tight group-hover:text-velyar-earth transition-colors duration-200 line-clamp-2">
                {title}
              </h3>
              <Badge variant="outline" className="text-xs bg-velyar-warm/10 text-velyar-earth border-velyar-warm/20">
                Active
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-2">
              {description.length > 80 ? `${description.substring(0, 80)}...` : description}
            </p>

            {/* Stats with country count like daily prompt */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users2 className="w-3 h-3" />
                <span className="font-ui">{participants.toLocaleString()}</span>
                <span>participants</span>
              </div>
              {displayLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="font-ui">{displayLocation}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Link to={`/create/mission/${id}`} className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="btn-secondary-enhanced w-full group-hover:bg-velyar-earth group-hover:text-white group-hover:border-velyar-earth transition-all duration-200"
                >
                  <span className="text-xs font-ui">Join Mission</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to={`/video-list/mission/${id}`}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="btn-secondary-enhanced px-3 group-hover:bg-velyar-soft group-hover:text-velyar-earth transition-all duration-200"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
