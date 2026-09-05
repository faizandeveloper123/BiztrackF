import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../models/auth';
import { extractErrorMessage } from '../utils/errorUtils';
import { VerifiedCompanyBadge } from '../components/common/VerifiedCompanyBadge';
import { BizTrackLogo } from '../components/brand/BizTrackLogo';
import { getApiBaseUrl } from '../config/apiConfig';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onEmailChange = useCallback((t: string) => {
    setEmail(t);
    setError('');
  }, []);

  const onPasswordChange = useCallback((t: string) => {
    setPassword(t);
    setError('');
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await login({
        email: email.trim(),
        password,
      } as LoginCredentials);

      if (!success) {
        const msg = 'Invalid email or password';
        setError(msg);
      }
    } catch (err: unknown) {
      let errorMessage = 'An error occurred';
      const e = err as {
        request?: unknown;
        response?: { data?: { detail?: string; message?: string } };
      };
      if (e?.request && !e?.response) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (e?.response?.data) {
        const data = e.response.data;
        if (typeof data.detail === 'string') errorMessage = data.detail;
        else if (typeof data.message === 'string') errorMessage = data.message;
        else errorMessage = extractErrorMessage(err, errorMessage);
      } else {
        errorMessage = extractErrorMessage(err, errorMessage);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="min-h-full grow justify-center bg-slate-50 px-4 py-8"
        className="flex-1 bg-slate-50"
      >
        <View className="mb-6 items-center">
          <BizTrackLogo size="hero" />
        </View>

        <View className="w-full max-w-md self-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Text className="text-center text-2xl font-bold text-slate-900">
            Welcome Back
          </Text>
          <Text className="mt-2 text-center text-slate-600">
            Sign in to your account
          </Text>

          {error ? (
            <View className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <Text className="text-center text-sm font-medium text-red-800">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-700">
                Email
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900"
                placeholder="you@company.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={onEmailChange}
              />
            </View>

            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-700">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-12 text-base text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={onPasswordChange}
                />
                <Pressable
                  className="absolute right-2 top-2 p-2"
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              className="mt-2 items-center rounded-lg bg-indigo-600 py-3.5 active:bg-indigo-700 disabled:opacity-50"
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Sign in
                </Text>
              )}
            </Pressable>
            {__DEV__ ? (
              <Text className="mt-4 text-center text-xs text-slate-400" selectable>
                API: {getApiBaseUrl()}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-6 w-full max-w-md self-center">
          <VerifiedCompanyBadge />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
