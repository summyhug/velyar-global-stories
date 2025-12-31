import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Flag,
  MessageSquare,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Video,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/PageLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Report {
  id: string;
  video_id: string;
  reporter_id: string;
  reason: string;
  category: string;
  description: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string;
    user_id: string;
    is_hidden: boolean;
  };
  reporter_profile: {
    username: string;
    display_name: string;
  };
}

interface Appeal {
  id: string;
  video_id: string;
  user_id: string;
  appeal_reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  response: string | null;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string;
    removal_reason: string | null;
    is_hidden: boolean;
  };
  user_profile: {
    username: string;
    display_name: string;
  };
}

const AdminModeration = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'hide' | 'dismiss' | 'restore' | 'deny' | null;
    itemId: string | null;
    videoId: string | null;
  }>({ open: false, type: null, itemId: null, videoId: null });
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          videos (id, title, thumbnail_url, user_id, is_hidden),
          reporter_profile:profiles!content_reports_reporter_id_fkey (username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    }
  };

  const fetchAppeals = async () => {
    try {
      const { data, error } = await supabase
        .from('content_appeals')
        .select(`
          *,
          videos (id, title, thumbnail_url, removal_reason, is_hidden),
          user_profile:profiles!content_appeals_user_id_fkey (username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppeals(data || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appeals',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchAppeals()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleHideVideo = async (videoId: string, reportId: string, reason: string) => {
    try {
      // Hide the video
      const { error: videoError } = await supabase
        .from('videos')
        .update({
          is_hidden: true,
          removal_reason: reason,
          moderation_status: 'hidden',
        })
        .eq('id', videoId);

      if (videoError) throw videoError;

      // Update report status
      const { error: reportError } = await supabase
        .from('content_reports')
        .update({
          status: 'reviewed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (reportError) throw reportError;

      // Log moderation action
      await supabase.from('moderation_actions').insert({
        video_id: videoId,
        action_type: 'hide',
        reason: reason,
        automated: false,
      });

      toast({
        title: 'Success',
        description: 'Video has been hidden and report marked as reviewed',
      });

      fetchReports();
    } catch (error) {
      console.error('Error hiding video:', error);
      toast({
        title: 'Error',
        description: 'Failed to hide video',
        variant: 'destructive',
      });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: 'dismissed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Report has been dismissed',
      });

      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss report',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreVideo = async (videoId: string, appealId: string) => {
    try {
      // Restore the video
      const { error: videoError } = await supabase
        .from('videos')
        .update({
          is_hidden: false,
          removal_reason: null,
          moderation_status: 'approved',
        })
        .eq('id', videoId);

      if (videoError) throw videoError;

      // Update appeal status
      const { error: appealError } = await supabase
        .from('content_appeals')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          response: 'Your appeal has been approved. The video has been restored.',
        })
        .eq('id', appealId);

      if (appealError) throw appealError;

      // Log moderation action
      await supabase.from('moderation_actions').insert({
        video_id: videoId,
        action_type: 'restore',
        reason: 'Appeal approved',
        automated: false,
      });

      toast({
        title: 'Success',
        description: 'Video has been restored and appeal approved',
      });

      fetchAppeals();
    } catch (error) {
      console.error('Error restoring video:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore video',
        variant: 'destructive',
      });
    }
  };

  const handleDenyAppeal = async (appealId: string) => {
    try {
      const { error } = await supabase
        .from('content_appeals')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString(),
          response: 'Your appeal has been reviewed and denied. The video will remain hidden.',
        })
        .eq('id', appealId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appeal has been denied',
      });

      fetchAppeals();
    } catch (error) {
      console.error('Error denying appeal:', error);
      toast({
        title: 'Error',
        description: 'Failed to deny appeal',
        variant: 'destructive',
      });
    }
  };

  const confirmAction = () => {
    const { type, itemId, videoId } = actionDialog;
    if (!itemId) return;

    switch (type) {
      case 'hide':
        if (videoId) {
          const report = reports.find((r) => r.id === itemId);
          handleHideVideo(videoId, itemId, report?.reason || 'Policy violation');
        }
        break;
      case 'dismiss':
        handleDismissReport(itemId);
        break;
      case 'restore':
        if (videoId) handleRestoreVideo(videoId, itemId);
        break;
      case 'deny':
        handleDenyAppeal(itemId);
        break;
    }

    setActionDialog({ open: false, type: null, itemId: null, videoId: null });
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return report.status === 'pending';
    return report.status === 'reviewed' || report.status === 'dismissed';
  });

  const filteredAppeals = appeals.filter((appeal) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return appeal.status === 'pending';
    return appeal.status === 'approved' || appeal.status === 'denied';
  });

  const getTimeSinceCreated = (createdAt: string) => {
    const hours = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    );
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isOverdue = (createdAt: string) => {
    const hours = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    );
    return hours > 24;
  };

  const header = (
    <div className="px-4 py-3 border-b border-velyar-earth/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="w-6 h-6 text-velyar-earth" />
          <h1 className="text-2xl font-display text-velyar-earth">Content Moderation</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchReports();
            fetchAppeals();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout header={header}>
      <div className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Reports
                {reports.filter((r) => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {reports.filter((r) => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="appeals" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Appeals
                {appeals.filter((a) => a.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {appeals.filter((a) => a.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-velyar-earth' : ''}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'reviewed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('reviewed')}
                className={filterStatus === 'reviewed' ? 'bg-velyar-earth' : ''}
              >
                Reviewed
              </Button>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-velyar-earth' : ''}
              >
                All
              </Button>
            </div>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-velyar-earth" />
                  <p className="text-muted-foreground mt-2">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <Card className="card-enhanced p-12 text-center">
                  <Flag className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground mt-4">No reports found</p>
                </Card>
              ) : (
                filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className={`card-enhanced ${
                      report.status === 'pending' && isOverdue(report.created_at)
                        ? 'border-red-300 bg-red-50/30'
                        : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0">
                          <img
                            src={report.videos.thumbnail_url}
                            alt="Video thumbnail"
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Report Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-display text-lg text-foreground">
                                {report.videos.title || 'Untitled Video'}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Reported by: {report.reporter_profile?.username}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeSinceCreated(report.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {report.status === 'pending' && isOverdue(report.created_at) && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Overdue
                                </Badge>
                              )}
                              <Badge
                                variant={report.status === 'pending' ? 'default' : 'secondary'}
                              >
                                {report.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-foreground">Category:</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {report.category}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">Reason:</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {report.reason}
                              </span>
                            </div>
                            {report.description && (
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  Description:
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {report.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {report.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'hide',
                                    itemId: report.id,
                                    videoId: report.video_id,
                                  })
                                }
                                disabled={report.videos.is_hidden}
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide Video
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'dismiss',
                                    itemId: report.id,
                                    videoId: null,
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Dismiss Report
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={`/videos/daily-prompt/all?video=${report.video_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Video
                                </a>
                              </Button>
                            </div>
                          )}

                          {report.reviewed_at && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed on {format(new Date(report.reviewed_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Appeals Tab */}
            <TabsContent value="appeals" className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-velyar-earth" />
                  <p className="text-muted-foreground mt-2">Loading appeals...</p>
                </div>
              ) : filteredAppeals.length === 0 ? (
                <Card className="card-enhanced p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground mt-4">No appeals found</p>
                </Card>
              ) : (
                filteredAppeals.map((appeal) => (
                  <Card
                    key={appeal.id}
                    className={`card-enhanced ${
                      appeal.status === 'pending' && isOverdue(appeal.created_at)
                        ? 'border-red-300 bg-red-50/30'
                        : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0">
                          <img
                            src={appeal.videos.thumbnail_url}
                            alt="Video thumbnail"
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Appeal Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-display text-lg text-foreground">
                                {appeal.videos.title || 'Untitled Video'}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Appeal by: {appeal.user_profile?.username}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeSinceCreated(appeal.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {appeal.status === 'pending' && isOverdue(appeal.created_at) && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Overdue
                                </Badge>
                              )}
                              <Badge
                                variant={appeal.status === 'pending' ? 'default' : 'secondary'}
                              >
                                {appeal.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-foreground">
                                Original Removal Reason:
                              </span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {appeal.videos.removal_reason || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">
                                Appeal Reason:
                              </span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {appeal.appeal_reason}
                              </p>
                            </div>
                            {appeal.response && (
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  Admin Response:
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {appeal.response}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {appeal.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'restore',
                                    itemId: appeal.id,
                                    videoId: appeal.video_id,
                                  })
                                }
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Restore Video
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    type: 'deny',
                                    itemId: appeal.id,
                                    videoId: null,
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deny Appeal
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={`/videos/daily-prompt/all?video=${appeal.video_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Video
                                </a>
                              </Button>
                            </div>
                          )}

                          {appeal.reviewed_at && (
                            <p className="text-xs text-muted-foreground">
                              Reviewed on {format(new Date(appeal.reviewed_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, itemId: null, videoId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'hide' && 'Hide Video?'}
              {actionDialog.type === 'dismiss' && 'Dismiss Report?'}
              {actionDialog.type === 'restore' && 'Restore Video?'}
              {actionDialog.type === 'deny' && 'Deny Appeal?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'hide' &&
                'This will hide the video from public view and mark the report as reviewed. The creator can appeal this decision.'}
              {actionDialog.type === 'dismiss' &&
                'This will mark the report as dismissed without taking action on the video.'}
              {actionDialog.type === 'restore' &&
                'This will restore the video to public view and approve the appeal. The creator will be notified.'}
              {actionDialog.type === 'deny' &&
                'This will deny the appeal and keep the video hidden. The creator will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className="bg-velyar-earth hover:bg-velyar-earth/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default AdminModeration;
