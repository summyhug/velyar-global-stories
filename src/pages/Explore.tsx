
import { ArrowLeft, Search, Filter, MapPin, Calendar, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const categories = [
    { name: "food", icon: "🍽️", count: 1247 },
    { name: "celebrations", icon: "🎉", count: 892 },
    { name: "nature", icon: "🌿", count: 654 },
    { name: "work", icon: "💼", count: 423 },
    { name: "family", icon: "👨‍👩‍👧‍👦", count: 321 },
    { name: "travel", icon: "✈️", count: 234 },
  ];

  const archivedPrompts = [
    {
      prompt: "what's your favorite sound?",
      date: "march 15, 2024",
      responses: 2847,
      countries: 94
    },
    {
      prompt: "show us your morning view",
      date: "march 14, 2024",
      responses: 3241,
      countries: 87
    },
    {
      prompt: "what makes you smile?",
      date: "march 13, 2024",
      responses: 2156,
      countries: 92
    }
  ];

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-foreground font-nunito">explore</h1>
          <Button variant="ghost" size="sm" className="p-2 ml-auto">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="search stories, themes, or places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-4 font-nunito">browse themes</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Link key={category.name} to={`/video-list/theme-${category.name}`}>
                <Card className="border-0 shadow-gentle cursor-pointer hover:shadow-warm transition-all">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className="text-sm font-medium text-foreground mb-1 font-nunito">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} global voices</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Archived Prompts */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-4 font-nunito">past prompts</h2>
          <div className="space-y-3">
            {archivedPrompts.map((prompt, index) => (
              <Link key={index} to={`/video-list/prompt-${prompt.prompt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}>
                <Card className="border-0 shadow-gentle cursor-pointer hover:shadow-warm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground font-nunito">"{prompt.prompt}"</h3>
                      <Video className="w-4 h-4 text-velyar-earth flex-shrink-0 ml-2" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{prompt.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{prompt.countries} countries</span>
                        </div>
                      </div>
                      <span>{prompt.responses.toLocaleString()} responses</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Explore;
