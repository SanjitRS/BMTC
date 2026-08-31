import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types/contract';
import { api } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>({
    id: 'usr_admin',
    email: 'admin@gurugale.org',
    name: 'Nischal Bhattacharya (Clinical Admin)',
    role: 'admin'
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Try to load current user from API
    api.getMe()
      .then(u => setUser(u))
      .catch(() => {
        // Fallback default admin
        setUser({
          id: 'usr_admin',
          email: 'admin@gurugale.org',
          name: 'Nischal Bhattacharya (Clinical Admin)',
          role: 'admin'
        });
      });
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email);
      localStorage.setItem('gurugale_token', data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    setIsLoading(true);
    try {
      const data = await api.switchRole(newRole);
      localStorage.setItem('gurugale_token', data.token);
      setUser(data.user);
    } catch (err) {
      console.warn('Switch role fallback', err);
      if (user) {
        setUser({ ...user, role: newRole });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gurugale_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'admin',
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
