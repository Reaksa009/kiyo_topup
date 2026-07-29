import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  walletBalance: number;
  referralCode: string;
  savedPlayerIds?: any[];
}

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  roleName: string;
  permissions: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  admin: AdminProfile | null;
  token: string | null;
  loginUser: (userData: UserProfile, token: string) => void;
  loginAdmin: (adminData: AdminProfile, token: string) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('kiyo_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.data.admin) {
        setAdmin(res.data.data.admin);
      } else if (res.data.data.user) {
        setUser(res.data.data.user);
      }
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const loginUser = (userData: UserProfile, authToken: string) => {
    setUser(userData);
    setAdmin(null);
    setToken(authToken);
    localStorage.setItem('kiyo_token', authToken);
  };

  const loginAdmin = (adminData: AdminProfile, authToken: string) => {
    setAdmin(adminData);
    setUser(null);
    setToken(authToken);
    localStorage.setItem('kiyo_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('kiyo_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        token,
        loginUser,
        loginAdmin,
        logout,
        refetchUser: fetchProfile,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
