import { useState, useEffect } from "react";
import { Plus, Calendar, Wand2, Edit, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DailyPrompt {
  id: string;
  date: string;
  prompt_text: string;
  theme_id: string | null;
  is_active: boolean;
  manual_override?: boolean;
  created_at: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
}

const AdminPrompts = () => {
  const [prompts, setPrompts] = useState<DailyPrompt[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<DailyPrompt | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    prompt_text: '',
    theme_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promptsRes, themesRes] = await Promise.all([
        supabase
          .from('daily_prompts')
          .select('*')
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('themes')
          .select('*')
          .eq('is_active', true)
      ]);

      if (promptsRes.data) setPrompts(promptsRes.data);
      if (themesRes.data) setThemes(themesRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIPrompt = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-prompt');
      
      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        prompt_text: data.prompt,
        theme_id: data.theme_id || ''
      }));

      toast({
        title: "AI Prompt Generated",
        description: "Generated prompt has been loaded into the form",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI prompt",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const promptData = {
        date: formData.date,
        prompt_text: formData.prompt_text,
        theme_id: formData.theme_id === 'no-theme' ? null : formData.theme_id || null,
        manual_override: true,
        is_active: formData.date === new Date().toISOString().split('T')[0]
      };

      if (editingPrompt) {
        await supabase
          .from('daily_prompts')
          .update(promptData)
          .eq('id', editingPrompt.id);
        toast({ title: "Success", description: "Prompt updated successfully" });
      } else {
        // Deactivate other prompts for this date
        await supabase
          .from('daily_prompts')
          .update({ is_active: false })
          .eq('date', formData.date);

        await supabase
          .from('daily_prompts')
          .insert(promptData);
        toast({ title: "Success", description: "Prompt created successfully" });
      }

      setIsDialogOpen(false);
      setEditingPrompt(null);
      setFormData({ date: '', prompt_text: '', theme_id: 'no-theme' });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      await supabase.from('daily_prompts').delete().eq('id', id);
      toast({ title: "Success", description: "Prompt deleted successfully" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };

  const activatePrompt = async (id: string, date: string) => {
    try {
      console.log('Activating prompt:', id);
      
      // First, get all currently active prompts to archive them
      const { data: activePrompts } = await supabase
        .from('daily_prompts')
        .select('*')
        .eq('is_active', true);

      // Archive the currently active prompts
      if (activePrompts && activePrompts.length > 0) {
        for (const prompt of activePrompts) {
          // Calculate stats for the archived prompt
          const { data: videos } = await supabase
            .from('videos')
            .select('id, location')
            .eq('daily_prompt_id', prompt.id)
            .eq('is_public', true);

          const voiceCount = videos?.length || 0;
          const countrySet = new Set(
            videos
              ?.map(video => video.location)
              .filter(location => location && location.trim() !== '')
              .map(location => location.split(',').pop()?.trim().toLowerCase())
              .filter(Boolean)
          );

          // Insert into archived_prompts
          await supabase
            .from('archived_prompts')
            .insert({
              prompt_text: prompt.prompt_text,
              archive_date: new Date().toISOString().split('T')[0],
              response_count: voiceCount,
              country_count: countrySet.size
            });
        }
      }

      // Deactivate all currently active prompts
      await supabase
        .from('daily_prompts')
        .update({ is_active: false })
        .eq('is_active', true);

      // Then activate the selected prompt
      await supabase
        .from('daily_prompts')
        .update({ is_active: true })
        .eq('id', id);

      console.log('Prompt activation complete');
      
      toast({ title: "Success", description: "Prompt activated and previous prompt archived" });
      fetchData();
    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: "Error",
        description: "Failed to activate prompt",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (prompt: DailyPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      date: prompt.date,
      prompt_text: prompt.prompt_text,
      theme_id: prompt.theme_id || 'no-theme',
    });
    setIsDialogOpen(true);
  };

  const getThemeName = (themeId: string | null) => {
    return themes.find(t => t.id === themeId)?.name || 'No theme';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Prompts Admin</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPrompt(null);
              setFormData({ date: '', prompt_text: '', theme_id: 'no-theme' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="prompt">Prompt Text</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="prompt"
                    value={formData.prompt_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt_text: e.target.value }))}
                    placeholder="Enter prompt text..."
                    required
                    className="flex-1"
                  />
                  <Button type="button" onClick={generateAIPrompt} size="sm">
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={formData.theme_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, theme_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-theme">No theme</SelectItem>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingPrompt ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className={prompt.is_active ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{prompt.date}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {prompt.is_active && <Badge variant="default">Active</Badge>}
                    {prompt.manual_override && <Badge variant="secondary">Manual</Badge>}
                    <Badge variant="outline">{getThemeName(prompt.theme_id)}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(prompt)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!prompt.is_active && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => activatePrompt(prompt.id, prompt.date)}
                      title="Activate this prompt"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePrompt(prompt.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">"{prompt.prompt_text}"</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPrompts;