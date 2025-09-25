import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthCtx = { 
  user: User | null; 
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  session: null,
  loading: true,
  signOut: async () => {},
  deleteAccount: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { 
      mounted = false; 
      subscription?.unsubscribe(); 
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      console.error('No user to delete');
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. Your videos will remain but will be disconnected from your account.'
    );

    if (!confirmed) {
      return;
    }

    try {
      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error('Error deleting account:', error);
        console.log('Failed to delete account. Please try again.');
        return;
      }

      // Sign out after successful deletion
      await signOut();
      console.log('Account deleted successfully.');
    } catch (error) {
      console.error('Error deleting account:', error);
      console.log('Failed to delete account. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}
