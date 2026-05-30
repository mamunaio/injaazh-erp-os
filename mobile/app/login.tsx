import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { signIn, authenticateBiometrics, isBiometricSupported } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    // Check if biometric authentication is available on device
    const checkBiometrics = async () => {
      const supported = await isBiometricSupported();
      setBiometricsAvailable(supported);
      
      // Auto-trigger biometric prompt if a user token already exists (convenience feature)
      if (supported) {
        handleBiometricLogin();
      }
    };
    checkBiometrics();
  }, []);

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all credentials');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setError(res.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Connection failed. Verify server configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    const res = await authenticateBiometrics();
    if (res.success) {
      router.replace('/(tabs)');
    } else if (res.error && res.error !== 'Authentication failed') {
      // Don't show generic cancel failures
      setError(res.error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        {/* Glow Background Effect */}
        <View className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Logo and Intro Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl items-center justify-center border border-indigo-500/20 mb-4 shadow-xl shadow-indigo-500/10">
            <Feather name="shield" size={32} color="#ffffff" />
          </View>
          <Text className="text-3xl font-black text-slate-100 tracking-tight">INJAAZH</Text>
          <Text className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mt-1">GLOBAL ENTERPRISE ERP</Text>
        </View>

        {/* Inputs & Actions Panel */}
        <View className="space-y-4">
          
          {/* Error Message */}
          {error && (
            <View className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex-row items-center gap-2 mb-2">
              <Feather name="alert-circle" size={16} color="#f43f5e" />
              <Text className="text-xs text-rose-400 font-bold flex-1">{error}</Text>
            </View>
          )}

          {/* Email input */}
          <View className="space-y-2">
            <Text className="text-xs font-bold text-slate-400 ml-1">Work Email</Text>
            <View className="relative flex-row items-center bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3">
              <Feather name="mail" size={16} color="#64748b" className="mr-3" />
              <TextInput
                placeholder="you@injaazh.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 text-slate-200 text-sm font-semibold"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="space-y-2 mt-4">
            <Text className="text-xs font-bold text-slate-400 ml-1">Security Password</Text>
            <View className="relative flex-row items-center bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3">
              <Feather name="lock" size={16} color="#64748b" className="mr-3" />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="flex-1 text-slate-200 text-sm font-semibold"
              />
            </View>
          </View>

          {/* Submit Sign In Button */}
          <TouchableOpacity 
            onPress={handlePasswordLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl py-3.5 items-center justify-center shadow-lg shadow-indigo-500/20 active:opacity-90 mt-6"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white">Secure Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Biometrics Option Button */}
          {biometricsAvailable && (
            <View className="items-center mt-6">
              <Text className="text-[11px] font-bold text-slate-500 mb-3">OR AUTHENTICATE SECURELY VIA</Text>
              <TouchableOpacity 
                onPress={handleBiometricLogin}
                className="flex-row items-center gap-2 px-5 py-3.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl active:opacity-75"
              >
                <Feather name="aperture" size={18} color="#818cf8" />
                <Text className="text-xs font-bold text-slate-300">Login with Face ID / Touch ID</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
