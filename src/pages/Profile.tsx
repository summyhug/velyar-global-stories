
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, LogOut, MapPin, Calendar, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, userStats, contributions, location, loading: profileLoading } = useProfile(user?.id);
  const { t } = useTranslation();

  if (profileLoading) {
    return (
      <div className="min-h-screen-safe bg-background font-quicksand flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground font-nunito">Loading...</div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'storyteller';
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }) : 'recently';

  const handleSignOut = async () => {
    await signOut();
  };

  // Header component
  const header = (
    <div className="px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="p-2 text-velyar-earth hover:bg-velyar-soft" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-medium text-velyar-earth font-nunito">{t('profile.yourProfile')}</h1>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
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
                  <span>{location || t('profile.locationNotSet')}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.joined', { date: joinedDate })}</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Impact Stats */}
          <section className="mt-6">
            <Card className="border-0 shadow-gentle">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-4 font-nunito">{t('profile.yourImpact')}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.mediaShared}</div>
                    <div className="text-xs text-muted-foreground">{t('profile.mediaShared')}</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.octosReceived}</div>
                    <div className="text-xs text-muted-foreground">{t('profile.octosReceived')}</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium text-velyar-earth font-nunito">{userStats.countriesReached}</div>
                    <div className="text-xs text-muted-foreground">{t('profile.countriesReached')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Mission Contributions */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground font-nunito">{t('profile.missionContributions')}</h2>
              <Link to="/contributions">
                <Button variant="ghost" size="sm" className="text-velyar-brown hover:bg-velyar-brown/10">
                  {t('profile.viewAll')}
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
          <section className="mt-8 space-y-6">
            <Card className="border-0 shadow-gentle">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-4 font-nunito">{t('profile.settings')}</h3>
                <div className="space-y-3">
                  <Link to="/general-settings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start text-sm gap-2 text-foreground hover:bg-velyar-soft">
                      <Settings className="w-4 h-4" />
                      {t('profile.general')}
                    </Button>
                  </Link>
                  <Link to="/privacy" className="w-full">
                    <Button variant="ghost" className="w-full justify-start text-sm gap-2 text-foreground hover:bg-velyar-soft">
                      <Shield className="w-4 h-4" />
                      {t('profile.privacySafety')}
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm gap-2 text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('profile.signOut')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
