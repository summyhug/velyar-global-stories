import { ArrowLeft, Award, MapPin, Calendar, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const badges = [
    { name: "kind commenter", description: "left 50+ thoughtful comments", icon: "💭", earned: true },
    { name: "global voice", description: "first from your region", icon: "🌍", earned: true },
    { name: "storyteller", description: "shared 25+ stories", icon: "📱", earned: true },
    { name: "connector", description: "featured in daily highlights", icon: "⭐", earned: false },
    { name: "cultural bridge", description: "stories viewed in 10+ countries", icon: "🌉", earned: false },
    { name: "early adopter", description: "joined velyar in beta", icon: "🚀", earned: true },
  ];

  const contributions = [
    { mission: "street markets of the world", date: "2 days ago", type: "story" },
    { mission: "morning rituals", date: "1 week ago", type: "story" },
    { mission: "sounds of home", date: "2 weeks ago", type: "story" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-foreground">your profile</h1>
          <Button variant="ghost" size="sm" className="p-2 ml-auto">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-8">
        {/* Profile Header */}
        <section className="mt-6">
          <Card className="bg-gradient-soft border-0 shadow-gentle">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-velyar-warm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🌟</span>
              </div>
              <h2 className="text-lg font-medium text-foreground mb-1">storyteller</h2>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span>san francisco, california</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>joined march 2024</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Impact Stats */}
        <section className="mt-6">
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">your impact</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-medium text-velyar-earth">47</div>
                  <div className="text-xs text-muted-foreground">stories shared</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-velyar-earth">12k</div>
                  <div className="text-xs text-muted-foreground">hearts received</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-velyar-earth">23</div>
                  <div className="text-xs text-muted-foreground">countries reached</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges & Recognition */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground">recognition</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-gentle ${badge.earned ? 'bg-card' : 'bg-muted/30'}`}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className={`text-2xl mb-2 ${!badge.earned && 'grayscale opacity-50'}`}>
                      {badge.icon}
                    </div>
                    <h4 className={`text-xs font-medium mb-1 ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Mission Contributions */}
        <section className="mt-6">
          <h2 className="text-lg font-medium text-foreground mb-4">mission contributions</h2>
          
          <div className="space-y-3">
            {contributions.map((contribution, index) => (
              <Card key={index} className="border-0 shadow-gentle">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{contribution.mission}</h4>
                      <p className="text-xs text-muted-foreground">{contribution.date}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {contribution.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="mt-8">
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">settings</h3>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  notification preferences
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  privacy & safety
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  language & region
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm text-destructive">
                  sign out
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Profile;