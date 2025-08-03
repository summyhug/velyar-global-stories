
import { ArrowLeft, Search, Filter, MapPin, Calendar, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Theme {
  id: string;
  name: string;
  icon: string;
  description?: string;
  video_count: number;
}

interface ArchivedPrompt {
  id: string;
  prompt_text: string;
  archive_date: string;
  response_count: number;
  country_count: number;
}

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [archivedPrompts, setArchivedPrompts] = useState<ArchivedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch themes with video counts
        const { data: themesData, error: themesError } = await supabase
          .from('themes')
          .select(`
            id,
            name,
            icon,
            description,
            video_themes(video_id)
          `)
          .eq('is_active', true);

        if (themesError) throw themesError;

        // Transform themes data with video counts
        const themesWithCounts = themesData?.map(theme => ({
          id: theme.id,
          name: theme.name,
          icon: theme.icon,
          description: theme.description,
          video_count: theme.video_themes?.length || 0
        })) || [];

        setThemes(themesWithCounts);

        // Fetch recent archived prompts (last 5 days only)
        const { data: promptsData, error: promptsError } = await supabase
          .from('archived_prompts')
          .select('*')
          .gte('archive_date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('archive_date', { ascending: false })
          .limit(5);

        if (promptsError) throw promptsError;

        setArchivedPrompts(promptsData || []);
        
      } catch (error) {
        console.error('Error fetching explore data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrompts = archivedPrompts.filter(prompt =>
    prompt.prompt_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen-safe bg-background font-quicksand content-safe-bottom">
      {/* Header */}
      <header className="sticky-header header-safe">
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
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-gentle">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-muted rounded mx-auto mb-2 animate-pulse" />
                    <div className="h-4 bg-muted rounded mb-1 animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredThemes.map((theme) => (
                <Link key={theme.id} to={`/video-list/theme/${theme.id}`}>
                  <Card className="border-0 shadow-gentle cursor-pointer hover:shadow-warm transition-all">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{theme.icon}</div>
                      <h3 className="text-sm font-medium text-foreground mb-1 font-nunito">{theme.name}</h3>
                      <p className="text-xs text-muted-foreground">{theme.video_count} global voices</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Archived Prompts */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-4 font-nunito">recent prompts</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-gentle">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2 animate-pulse" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                      </div>
                      <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrompts.map((prompt) => (
                <Link key={prompt.id} to={`/video-list/archived-prompt/${prompt.id}`}>
                  <Card className="border-0 shadow-gentle cursor-pointer hover:shadow-warm transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-foreground font-nunito">"{prompt.prompt_text}"</h3>
                        <Video className="w-4 h-4 text-velyar-earth flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(prompt.archive_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{prompt.country_count} countries</span>
                          </div>
                        </div>
                        <span>{prompt.response_count.toLocaleString()} responses</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Explore;
