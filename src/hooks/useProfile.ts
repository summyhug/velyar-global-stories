import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  mediaShared: number;
  octosReceived: number;
  countriesReached: number;
}

interface MissionContribution {
  mission: string;
  date: string;
  type: string;
  missionId: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ mediaShared: 0, octosReceived: 0, countriesReached: 0 });
  const [contributions, setContributions] = useState<MissionContribution[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Get user metadata for location info
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user && user.id === userId) {
          const city = user.user_metadata?.city;
          const country = user.user_metadata?.country;
          if (city && country) {
            setLocation(`${city}, ${country}`);
          }
        }

        // Fetch user videos for stats
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select(`
            id,
            created_at,
            mission_id,
            missions(title)
          `)
          .eq('user_id', userId)
          .eq('is_public', true);

        if (videosError) throw videosError;

        // Calculate media shared
        const mediaShared = videosData?.length || 0;

        // Fetch total likes on user's videos
        let octosReceived = 0;
        if (videosData && videosData.length > 0) {
          const videoIds = videosData.map(v => v.id);
          const { data: likesData, error: likesError } = await supabase
            .from('video_likes')
            .select('id')
            .in('video_id', videoIds);

          if (!likesError) {
            octosReceived = likesData?.length || 0;
          }
        }

        // For now, set countries reached to a placeholder (would need view tracking)
        const countriesReached = Math.min(mediaShared * 2, 23); // Placeholder logic

        setUserStats({ mediaShared, octosReceived, countriesReached });

        // Process mission contributions
        const contributionsMap = new Map();
        videosData?.forEach(video => {
          if (video.missions?.title) {
            const missionTitle = video.missions.title;
            if (!contributionsMap.has(missionTitle)) {
              contributionsMap.set(missionTitle, {
                mission: missionTitle,
                date: new Date(video.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                }),
                type: 'view',
                missionId: video.mission_id
              });
            }
          }
        });

        setContributions(Array.from(contributionsMap.values()).slice(0, 3));

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  return {
    profile,
    userStats,
    contributions,
    location,
    loading,
    error
  };
}