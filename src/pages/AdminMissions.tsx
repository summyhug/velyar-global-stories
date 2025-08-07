import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
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

interface Mission {
  id: string;
  title: string;
  description: string;
  location_needed: string | null;
  image_url: string | null;
  is_active: boolean;
  participants_count: number;
  target_regions: any;
  theme_id: string | null;
  created_at: string;
}

interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
}


const AdminMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_needed: '',
    image_url: '',
    target_regions: '',
    theme_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [missionsRes, themesRes] = await Promise.all([
        supabase
          .from('missions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('themes')
          .select('*')
          .eq('is_active', true)
      ]);

      if (missionsRes.data) setMissions(missionsRes.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const missionData = {
        title: formData.title,
        description: formData.description,
        location_needed: formData.location_needed || null,
        image_url: formData.image_url || null,
        target_regions: formData.target_regions ? formData.target_regions.split(',').map(r => r.trim()) : null,
        theme_id: formData.theme_id || null,
        is_active: true
      };

      if (editingMission) {
        await supabase
          .from('missions')
          .update(missionData)
          .eq('id', editingMission.id);
        toast({ title: "Success", description: "Mission updated successfully" });
      } else {
        await supabase
          .from('missions')
          .insert(missionData);
        toast({ title: "Success", description: "Mission created successfully" });
      }

      setIsDialogOpen(false);
      setEditingMission(null);
      setFormData({ title: '', description: '', location_needed: '', image_url: '', target_regions: '', theme_id: '' });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mission",
        variant: "destructive",
      });
    }
  };

  const deleteMission = async (id: string) => {
    try {
      await supabase.from('missions').delete().eq('id', id);
      toast({ title: "Success", description: "Mission deleted successfully" });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mission",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description,
      location_needed: mission.location_needed || '',
      image_url: mission.image_url || '',
      target_regions: mission.target_regions ? mission.target_regions.join(', ') : '',
      theme_id: mission.theme_id || '',
    });
    setIsDialogOpen(true);
  };

  const getThemeName = (themeId: string | null) => {
    if (!themeId) return null;
    const theme = themes.find(t => t.id === themeId);
    return theme ? `${theme.icon} ${theme.name}` : null;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Missions Admin</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMission(null);
              setFormData({ title: '', description: '', location_needed: '', image_url: '', target_regions: '', theme_id: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMission ? 'Edit Mission' : 'Create New Mission'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter mission description..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location Needed</Label>
                <Input
                  id="location"
                  value={formData.location_needed}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_needed: e.target.value }))}
                  placeholder="e.g., Urban areas, Markets..."
                />
              </div>

              <div>
                <Label htmlFor="regions">Target Regions (comma-separated)</Label>
                <Input
                  id="regions"
                  value={formData.target_regions}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_regions: e.target.value }))}
                  placeholder="e.g., Asia, Europe, North America"
                />
              </div>

              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={formData.theme_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, theme_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <span className="flex items-center gap-2">
                          {theme.icon} {theme.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingMission ? 'Update' : 'Create'}
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
        {missions.map((mission) => (
          <Card key={mission.id} className={mission.is_active ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{mission.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {mission.is_active && <Badge variant="default">Active</Badge>}
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      {mission.participants_count} participants
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(mission)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMission(mission.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{mission.description}</p>
              {getThemeName(mission.theme_id) && (
                <p className="text-xs text-muted-foreground mb-1">
                  Theme: {getThemeName(mission.theme_id)}
                </p>
              )}
              {mission.target_regions && (
                <p className="text-xs text-muted-foreground">
                  Regions: {mission.target_regions.join(', ')}
                </p>
              )}
              {mission.location_needed && (
                <p className="text-xs text-muted-foreground">
                  Location: {mission.location_needed}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminMissions;