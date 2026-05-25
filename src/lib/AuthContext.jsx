import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  const [authChecked, setAuthChecked]         = useState(false);

  useEffect(() => {
    // فحص الجلسة عند تحميل التطبيق
    checkUserAuth();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const fullUser = {
        ...authUser,
        ...(profile || {}),
        email: authUser.email,
      };

      setUser(fullUser);
      setIsAuthenticated(true);
    } catch (error) {
      // حتى لو مافي profile، المستخدم مصادق عليه
      setUser(authUser);
      setIsAuthenticated(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error || !authUser) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        await loadUserProfile(authUser);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false, // مو محتاجها مع Supabase
      authError: null,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
