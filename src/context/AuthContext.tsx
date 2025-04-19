import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

const DJANGO_API_URL = 'https://your-django-api.com'; // Replace with your actual Django API URL

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // If we have a Supabase session, use it
          const { id, email } = session.user;
          const username = email?.split('@')[0] || '';
          
          const mockUser = {
            id: parseInt(id.substring(0, 8), 16), // Convert part of UUID to number for Django compatibility
            username,
            email: email || ''
          };
          
          setUser(mockUser);
          setIsLoggedIn(true);
        } else {
          // Otherwise check for Django session
          const storedUser = localStorage.getItem('django_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Try to authenticate with Django API
      const response = await fetch(`${DJANGO_API_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies in the request
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('django_user', JSON.stringify(userData.user));
        setUser(userData.user);
        setIsLoggedIn(true);
        return true;
      }
      
      // If Django auth fails, try with Supabase as fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        return false;
      }
      
      if (data.user) {
        const mockUser = {
          id: parseInt(data.user.id.substring(0, 8), 16), // Convert part of UUID to number for Django compatibility
          username: email.split('@')[0],
          email
        };
        
        setUser(mockUser);
        setIsLoggedIn(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      setLoading(true);
      
      // Register with Django API
      const response = await fetch(`${DJANGO_API_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('django_user', JSON.stringify(userData.user));
        setUser(userData.user);
        setIsLoggedIn(true);
        return true;
      }
      
      // If Django registration fails, try with Supabase as fallback
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });
      
      if (error) {
        console.error('Supabase registration error:', error);
        return false;
      }
      
      if (data.user) {
        const mockUser = {
          id: parseInt(data.user.id.substring(0, 8), 16),
          username,
          email
        };
        
        setUser(mockUser);
        setIsLoggedIn(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Logout from Django API
      await fetch(`${DJANGO_API_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Also logout from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage and state
      localStorage.removeItem('django_user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      
      // Try Django API first
      const response = await fetch(`${DJANGO_API_URL}/api/password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        return true;
      }
      
      // If Django fails, try Supabase as fallback
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        console.error('Supabase password reset error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      
      // Try Django API first
      const response = await fetch(`${DJANGO_API_URL}/api/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      
      if (response.ok) {
        return true;
      }
      
      // If Django fails, try Supabase as fallback
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Supabase password update error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn, 
      login, 
      register, 
      logout, 
      loading,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
