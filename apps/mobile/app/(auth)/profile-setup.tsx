import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthScreen, ApiErrorText, FormError, FormInput, FormLabel, SubmitButton } from '@/components/AuthScreen';
import { useUpdateProfileMutation } from '@/store/authApi';
import { updateUser } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters'), location: z.string().optional() });
type Form = z.infer<typeof schema>;

export default function ProfileSetup() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: user?.name ?? '', location: user?.location ?? '' } });

  if (!user) { router.replace('/login'); return null; }

  const submit = async (values: Form) => {
    setApiError('');
    try {
      await updateProfile({ ...values, role: user.role }).unwrap();
      dispatch(updateUser(values));
      router.replace(user.role === 'buyer' ? '/(buyer)/dashboard' : '/(kisan)/dashboard');
    } catch (error: any) {
      setApiError(error?.data?.message ?? 'Unable to save your profile.');
    }
  };

  return (
    <AuthScreen title="Complete your profile" subtitle="Add the details buyers and farmers need to know.">
      <FormLabel>Name</FormLabel>
      <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
        <FormInput value={value} onChangeText={onChange} />
      )} />
      <FormError>{errors.name?.message}</FormError>

      <FormLabel>Location (optional)</FormLabel>
      <Controller control={control} name="location" render={({ field: { onChange, value } }) => (
        <FormInput value={value} onChangeText={onChange} placeholder="Village, district" />
      )} />

      <ApiErrorText>{apiError}</ApiErrorText>
      <SubmitButton label="Save and continue" loading={isLoading} onPress={handleSubmit(submit)} />
    </AuthScreen>
  );
}
