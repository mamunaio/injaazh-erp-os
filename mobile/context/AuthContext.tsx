import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  authenticateBiometrics: () => Promise<{ success: boolean; error?: string }>;
  isBiometricSupported: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Check if token exists in SecureStore on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const userDataStr = await SecureStore.getItemAsync('userData');
        if (token && userDataStr) {
          setUserToken(token);
          setUser(JSON.parse(userDataStr));
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      
      if (json.success) {
        const { token, user: profile } = json.data;
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(profile));
        setUserToken(token);
        setUser(profile);
        return { success: true };
      } else {
        return { success: false, error: json.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, error: 'Cannot connect to auth server' };
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to sign out:', e);
    }
  };

  const isBiometricSupported = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (e) {
      console.error('Error checking biometric support:', e);
      return false;
    }
  };

  const authenticateBiometrics = async () => {
    try {
      const supported = await isBiometricSupported();
      if (!supported) {
        return { success: false, error: 'Biometrics not supported or setup on this device' };
      }

      const savedToken = await SecureStore.getItemAsync('userToken');
      const savedUserData = await SecureStore.getItemAsync('userData');

      if (!savedToken || !savedUserData) {
        return { success: false, error: 'Please sign in with password first to enable biometrics' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Injaazh ERP',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setUserToken(savedToken);
        setUser(JSON.parse(savedUserData));
        return { success: true };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Error authenticating biometrics' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        user,
        signIn,
        signOut,
        authenticateBiometrics,
        isBiometricSupported,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
