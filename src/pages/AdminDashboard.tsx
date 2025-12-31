import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Flag,
  Video,
  Target,
  Calendar,
  Upload,
  Users,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/PageLayout';

interface DashboardStats {
  totalVideos: number;
  pendingReports: number;
  pendingAppeals: number;
  totalUsers: number;
  activeMissions: number;
  activePrompts: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    pendingReports: 0,
    pendingAppeals: 0,
    totalUsers: 0,
    activeMissions: 0,
    activePrompts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total videos
        const { count: videoCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true });

        // Fetch pending reports
        const { count: reportCount } = await supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch pending appeals
        const { count: appealCount } = await supabase
          .from('content_appeals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch active missions
        const { count: missionCount } = await supabase
          .from('missions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch active prompts
        const { count: promptCount } = await supabase
          .from('daily_prompts')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        setStats({
          totalVideos: videoCount || 0,
          pendingReports: reportCount || 0,
          pendingAppeals: appealCount || 0,
          totalUsers: userCount || 0,
          activeMissions: missionCount || 0,
          activePrompts: promptCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminSections = [
    {
      title: 'Content Moderation',
      description: 'Review reports and appeals',
      icon: Flag,
      href: '/admin/moderation',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      stats: [
        { label: 'Pending Reports', value: stats.pendingReports },
        { label: 'Pending Appeals', value: stats.pendingAppeals },
      ],
      alert: stats.pendingReports > 0 || stats.pendingAppeals > 0,
    },
    {
      title: 'Videos',
      description: 'Manage and moderate videos',
      icon: Video,
      href: '/admin/videos',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: [{ label: 'Total Videos', value: stats.totalVideos }],
    },
    {
      title: 'Missions',
      description: 'Create and manage missions',
      icon: Target,
      href: '/admin/missions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: [{ label: 'Active Missions', value: stats.activeMissions }],
    },
    {
      title: 'Daily Prompts',
      description: 'Manage daily prompts',
      icon: Calendar,
      href: '/admin/prompts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: [{ label: 'Active Prompts', value: stats.activePrompts }],
    },
    {
      title: 'Upload Video',
      description: 'Upload videos for prompts/missions',
      icon: Upload,
      href: '/admin/upload',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const header = (
    <div className="px-4 py-3 border-b border-velyar-earth/20">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <LayoutDashboard className="w-6 h-6 text-velyar-earth" />
        <h1 className="text-2xl font-display text-velyar-earth">Admin Dashboard</h1>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-enhanced">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-velyar-earth">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-velyar-earth/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Videos</p>
                    <p className="text-3xl font-bold text-velyar-earth">{stats.totalVideos}</p>
                  </div>
                  <Video className="w-8 h-8 text-velyar-earth/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced border-red-200 bg-red-50/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Review</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.pendingReports + stats.pendingAppeals}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600/40" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} to={section.href}>
                  <Card className="card-interactive group hover:border-velyar-earth/30 transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${section.bgColor}`}>
                            <Icon className={`w-6 h-6 ${section.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-display text-foreground group-hover:text-velyar-earth transition-colors">
                              {section.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {section.description}
                            </CardDescription>
                          </div>
                        </div>
                        {section.alert && (
                          <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                        )}
                      </div>
                    </CardHeader>
                    {section.stats && (
                      <CardContent className="pt-0">
                        <div className="flex gap-4">
                          {section.stats.map((stat, idx) => (
                            <div key={idx}>
                              <p className="text-xs text-muted-foreground">{stat.label}</p>
                              <p className="text-xl font-bold text-velyar-earth">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
