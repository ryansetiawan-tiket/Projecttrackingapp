import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean; // Admin role based on email whitelist
  loading: boolean;
  accessToken: string | null; // User's access token for authenticated requests
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Supabase client singleton
const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Admin email whitelist
const ADMIN_EMAILS = [
  'ryan.setiawan@tiket.com',
  // Add more admin emails here as needed
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        setUser(null);
        setAccessToken(null);
      } else if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
        setAccessToken(session.access_token);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Error in checkSession:', error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    await checkSession();
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email,
        user_metadata: data.session.user.user_metadata,
      });
      setAccessToken(data.session.access_token);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    // Call the server endpoint to create user
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to sign up');
    }

    // After signup, sign in automatically
    await signIn(email, password);
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      throw error;
    }

    setUser(null);
    setAccessToken(null);
  };

  // Check if user is admin based on email whitelist
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isAdmin,
    loading,
    accessToken,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
