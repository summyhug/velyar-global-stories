import { ArrowLeft, Search, Grid3X3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const Explore = () => {
  const categories = [
    { name: "food", count: "2.4k", color: "bg-orange-100 text-orange-700", icon: "🍽️" },
    { name: "celebrations", count: "1.8k", color: "bg-pink-100 text-pink-700", icon: "🎉" },
    { name: "nature", count: "3.1k", color: "bg-green-100 text-green-700", icon: "🌿" },
    { name: "work", count: "1.2k", color: "bg-blue-100 text-blue-700", icon: "💼" },
    { name: "family", count: "2.7k", color: "bg-purple-100 text-purple-700", icon: "👨‍👩‍👧‍👦" },
    { name: "music", count: "987", color: "bg-yellow-100 text-yellow-700", icon: "🎵" },
    { name: "traditions", count: "1.5k", color: "bg-red-100 text-red-700", icon: "🏛️" },
    { name: "creativity", count: "892", color: "bg-indigo-100 text-indigo-700", icon: "🎨" },
  ];

  const recentPrompts = [
    { text: "what did you eat last night?", date: "today", responses: "2.8k" },
    { text: "show us your morning view", date: "yesterday", responses: "3.2k" },
    { text: "what makes you smile?", date: "2 days ago", responses: "4.1k" },
    { text: "your favorite local sound", date: "3 days ago", responses: "1.9k" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium text-foreground">explore</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="search stories by theme or location..."
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-8">
        {/* Categories Grid */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground">themes</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => (
              <Card key={index} className="border-0 shadow-gentle hover:shadow-warm transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-medium text-foreground">{category.name}</h3>
                      <span className="text-xs text-muted-foreground">{category.count} stories</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Prompts */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-velyar-earth" />
            <h2 className="text-lg font-medium text-foreground">recent prompts</h2>
          </div>
          
          <div className="space-y-3">
            {recentPrompts.map((prompt, index) => (
              <Card key={index} className="border-0 shadow-gentle hover:shadow-warm transition-all duration-300 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground text-sm">"{prompt.text}"</h3>
                    <span className="text-xs text-muted-foreground">{prompt.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{prompt.responses} responses</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Location Stories */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-4">browse by location</h2>
          
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-velyar-soft rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-velyar-earth" />
              </div>
              <h3 className="font-medium text-foreground mb-2">explore the world map</h3>
              <p className="text-sm text-muted-foreground mb-4">
                discover stories from every corner of the globe
              </p>
              <Button variant="outline" size="sm">
                open world map
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Explore;