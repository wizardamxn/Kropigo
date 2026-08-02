import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthScreen, ApiErrorText, FormError, FormInput, FormLabel, SubmitButton } from '@/components/AuthScreen';
import { useRegisterMutation, useSendOtpMutation, useVerifyOtpMutation } from '@/store/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import { saveToken } from '@/lib/secureToken';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['kisan', 'buyer']),
});
type Form = z.infer<typeof schema>;

const RESEND_COOLDOWN_SECONDS = 30;

export default function Register() {
  const dispatch = useAppDispatch();
  const [registerAccount, { isLoading: isRegistering }] = useRegisterMutation();
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [apiError, setApiError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phase, setPhase] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { control, handleSubmit, watch, setValue, getValues } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', role: 'kisan' },
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const role = watch('role');
  const isBusy = isRegistering || isSendingOtp || isVerifyingOtp;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const requestOtp = async (phone: string, email: string) => {
    await sendOtp({ phone, email }).unwrap();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const onSubmitDetails = handleSubmit(
    async (values) => {
      setApiError('');
      try {
        await requestOtp(values.phone, values.email);
        setPhase('otp');
      } catch (error: any) {
        setApiError(error?.data?.message ?? 'Unable to send OTP.');
      }
    },
    (formErrors) => {
      const next: Partial<Record<keyof Form, string>> = {};
      (Object.keys(formErrors) as Array<keyof Form>).forEach((key) => { next[key] = formErrors[key]?.message; });
      setErrors(next);
    },
  );

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      await requestOtp(getValues('phone'), getValues('email'));
    } catch (error: any) {
      setOtpError(error?.data?.message ?? 'Unable to resend OTP.');
    }
  };

  const handleVerifyAndRegister = async () => {
    setOtpError('');
    const values = getValues();
    try {
      const verifyResponse = await verifyOtp({ phone: values.phone, otp }).unwrap();
      const verificationToken = verifyResponse.data.verificationToken;
      const response = await registerAccount({ ...values, verificationToken }).unwrap();
      if (!response.data.token) throw new Error('No session token returned');
      await saveToken(response.data.token);
      dispatch(setUser(response.data.user));
      router.replace(response.data.user.role === 'buyer' ? '/(buyer)/dashboard' : '/(kisan)/dashboard');
    } catch (error: any) {
      setOtpError(error?.data?.message ?? error.message ?? 'Invalid OTP.');
    }
  };

  return (
    <AuthScreen title="Join KropiGo" subtitle="Choose your role and create your account." footerHref="/login" footerText="Already have an account?" footerAction="Sign in">
      {phase === 'details' ? (
        <>
          <FormLabel>I am a</FormLabel>
          <View className="flex-row gap-2">
            {(['kisan', 'buyer'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setValue('role', value)}
                className={`flex-1 items-center rounded-xl border p-3 ${role === value ? 'border-primary bg-green-50 dark:bg-green-950' : 'border-stone-300 dark:border-stone-700'}`}
              >
                <Text className={`font-bold ${role === value ? 'text-primary' : 'text-stone-500 dark:text-stone-400'}`}>
                  {value === 'kisan' ? 'Farmer' : 'Buyer'}
                </Text>
              </Pressable>
            ))}
          </View>

          <FormLabel>Full name</FormLabel>
          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <FormInput value={value} onChangeText={onChange} placeholder="Your name" />
          )} />
          <FormError>{errors.name}</FormError>

          <FormLabel>Email</FormLabel>
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <FormInput autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} placeholder="you@example.com" />
          )} />
          <FormError>{errors.email}</FormError>

          <FormLabel>Phone</FormLabel>
          <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
            <FormInput keyboardType="phone-pad" value={value} onChangeText={onChange} placeholder="9876543210" />
          )} />
          <FormError>{errors.phone}</FormError>

          <FormLabel>Password</FormLabel>
          <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
            <FormInput secureTextEntry value={value} onChangeText={onChange} placeholder="At least 6 characters" />
          )} />
          <FormError>{errors.password}</FormError>

          <ApiErrorText>{apiError}</ApiErrorText>
          <SubmitButton label="Send OTP" loading={isSendingOtp} onPress={onSubmitDetails} />
        </>
      ) : (
        <>
          <Text className="mt-4 text-stone-600 dark:text-stone-400">
            Enter the 6-digit code sent to {getValues('phone')}
          </Text>
          <FormLabel>OTP</FormLabel>
          <FormInput
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="text-center tracking-widest"
          />
          <FormError>{otpError}</FormError>

          <SubmitButton
            label={isVerifyingOtp ? 'Verifying…' : isRegistering ? 'Creating account…' : 'Verify & create account'}
            loading={isVerifyingOtp || isRegistering}
            disabled={otp.length !== 6}
            onPress={handleVerifyAndRegister}
          />

          <View className="mt-5 flex-row items-center justify-between">
            <Pressable disabled={isBusy} onPress={() => { setPhase('details'); setOtp(''); setOtpError(''); }}>
              <Text className="text-stone-600 dark:text-stone-400">Change phone number</Text>
            </Pressable>
            <Pressable disabled={isBusy || resendCooldown > 0} onPress={handleResendOtp}>
              <Text className="font-bold text-primary">{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </AuthScreen>
  );
}
