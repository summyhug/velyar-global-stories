
import { ArrowLeft, MapPin, Calendar, Share2, Settings, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEffect } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, userStats, contributions, location, loading: profileLoading } = useProfile(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background font-quicksand flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground font-nunito">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.display_name || profile?.username || 'storyteller';
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }) : 'recently';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background font-quicksand">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-foreground font-nunito">your profile</h1>
          <Button variant="ghost" size="sm" className="p-2 ml-auto">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Profile Header */}
        <section className="mt-6">
          <Card className="bg-gradient-soft border-0 shadow-gentle">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-velyar-warm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h2 className="text-lg font-medium text-foreground mb-1 font-nunito">{displayName}</h2>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span>{location || 'location not set'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>joined {joinedDate}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Impact Stats */}
        <section className="mt-6">
          <Card className="border-0 shadow-gentle">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4 font-nunito">your impact</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.mediaShared}</div>
                  <div className="text-xs text-muted-foreground">media shared</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.octosReceived}</div>
                  <div className="text-xs text-muted-foreground">octos received</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.countriesReached}</div>
                  <div className="text-xs text-muted-foreground">countries reached</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mission Contributions */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground font-nunito">mission contributions</h2>
            <Link to="/contributions">
              <Button variant="ghost" size="sm" className="text-velyar-brown hover:bg-velyar-brown/10">
                view all
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {contributions.slice(0, 3).map((contribution, index) => (
              <Card key={index} className="border-0 shadow-gentle">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground font-nunito">{contribution.mission}</h4>
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
              <h3 className="text-sm font-medium text-foreground mb-4 font-nunito">settings</h3>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start text-sm gap-2">
                  <Settings className="w-4 h-4" />
                  notification preferences
                </Button>
                <Link to="/privacy" className="w-full">
                  <Button variant="ghost" className="w-full justify-start text-sm gap-2">
                    <Shield className="w-4 h-4" />
                    privacy & safety
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-sm gap-2">
                  <Globe className="w-4 h-4" />
                  general
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
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
