import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem('sb_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('sb_session');
      }
    });
    const stored = localStorage.getItem('sb_session');
    if (!session && stored) {
      setSession(JSON.parse(stored));
    }
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return { session, signIn, signOut };
};
