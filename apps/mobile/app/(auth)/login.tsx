import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthScreen, ApiErrorText, FormError, FormInput, FormLabel, SubmitButton } from '@/components/AuthScreen';
import { useLoginMutation } from '@/store/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import { saveToken } from '@/lib/secureToken';

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(6, 'Password must be at least 6 characters') });
type Form = z.infer<typeof schema>;

export default function Login() {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const submit = async (values: Form) => {
    setApiError('');
    try {
      const response = await login(values).unwrap();
      if (!response.data.token) throw new Error('No session token returned');
      await saveToken(response.data.token);
      dispatch(setUser(response.data.user));
      router.replace(response.data.user.role === 'buyer' ? '/(buyer)/dashboard' : '/(kisan)/dashboard');
    } catch (error: any) {
      setApiError(error?.data?.message ?? error.message ?? 'Unable to sign in.');
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to continue trading." footerHref="/register" footerText="New to KropiGo?" footerAction="Create account">
      <FormLabel>Email</FormLabel>
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <FormInput autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} placeholder="you@example.com" />
      )} />
      <FormError>{errors.email?.message}</FormError>

      <FormLabel>Password</FormLabel>
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <FormInput secureTextEntry value={value} onChangeText={onChange} placeholder="Your password" />
      )} />
      <FormError>{errors.password?.message}</FormError>

      <ApiErrorText>{apiError}</ApiErrorText>
      <SubmitButton label="Sign in" loading={isLoading} onPress={handleSubmit(submit)} />
    </AuthScreen>
  );
}
