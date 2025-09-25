
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Users2, Clock, Sparkles, ArrowLeft, Search, Filter, Video, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";
import { VideoViewer } from "@/components/VideoViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, Link } from "react-router-dom";

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
  const { t } = useTranslation();
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

  // Header component
  const header = (
    <div className="px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 text-velyar-earth hover:bg-velyar-soft"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-medium text-velyar-earth font-nunito">{t('explore.explore')}</h1>
        <Button variant="ghost" size="sm" className="p-2 ml-auto text-velyar-earth hover:bg-velyar-soft">
          <Filter className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('explore.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <section className="mt-8">
            <h2 className="text-lg font-medium text-foreground mb-4 font-nunito">{t('explore.browseThemes')}</h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-gentle">
                    <CardContent className="p-4 text-center">
                      <Skeleton className="w-8 h-8 rounded mx-auto mb-2" />
                      <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
                      <Skeleton className="h-3 w-1/2 mx-auto" />
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
                        <p className="text-xs text-muted-foreground">{theme.video_count} {t('explore.globalVoices')}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Archived Prompts */}
          <section className="mt-8">
            <h2 className="text-lg font-medium text-foreground mb-4 font-nunito">{t('explore.recentPrompts')}</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-gentle">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-3 w-16" />
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
                              <span>{prompt.country_count} {t('explore.countries')}</span>
                            </div>
                          </div>
                          <span>{prompt.response_count.toLocaleString()} {t('explore.responses')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Explore;
