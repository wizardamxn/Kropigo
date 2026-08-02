import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { useUpdateProfileMutation } from '@/store/authApi';
import { useDeleteCloudinaryMediaMutation } from '@/store/mediaApi';
import { updateUser } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { DocumentField } from '@/components/profile/DocumentField';
import { ProfileIdentity, ProfileSettings } from '@/components/profile/ProfileShell';
import { Button, Card, Field, Input, PageHeader, Screen, SectionTitle } from '@/components/ui';

interface FormState {
  name: string;
  location: string;
  profilePhoto: string;
  aadharCardPhoto: string;
}

const EMPTY: FormState = { name: '', location: '', profilePhoto: '', aadharCardPhoto: '' };

export default function BuyerProfile() {
  const t = useTranslations('mobile.profile');
  const tActions = useTranslations('mobile.actions');
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [cleanupMedia] = useDeleteCloudinaryMediaMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [staleUrls, setStaleUrls] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string>();

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      location: user.location ?? '',
      profilePhoto: user.profilePhoto ?? '',
      aadharCardPhoto: user.aadharCardPhoto ?? '',
    });
  }, [user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setDocument = (key: keyof FormState) => (url: string, replacedUrl?: string) => {
    set(key, url);
    if (replacedUrl) setStaleUrls((prev) => [...prev, replacedUrl]);
  };

  const save = async () => {
    if (form.name.trim().length < 2) {
      setNameError(t('nameError'));
      return;
    }
    setNameError(undefined);
    if (!user) return;

    try {
      await updateProfile({
        name: form.name.trim(),
        role: user.role,
        location: form.location.trim(),
        profilePhoto: form.profilePhoto,
        aadharCardPhoto: form.aadharCardPhoto,
      }).unwrap();

      dispatch(updateUser({
        name: form.name.trim(),
        location: form.location.trim(),
        profilePhoto: form.profilePhoto,
        aadharCardPhoto: form.aadharCardPhoto,
      }));

      if (staleUrls.length) {
        await cleanupMedia({ mediaUrls: staleUrls }).unwrap().catch(() => undefined);
        setStaleUrls([]);
      }
      toast.success(t('saved'), { description: t('savedBody') });
    } catch {
      // errorToastMiddleware already surfaced the failure.
    }
  };

  return (
    <Screen>
      <PageHeader title={t('title')} subtitle={t('subtitleBuyer')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <ProfileIdentity user={user} photoUrl={form.profilePhoto} accent="amber" />

          <Card>
            <SectionTitle>{t('yourDetails')}</SectionTitle>
            <Field label={t('businessName')} error={nameError}>
              <Input value={form.name} onChangeText={(value) => set('name', value)} placeholder={t('businessHint')} />
            </Field>
            <Field label={t('city')}>
              <Input value={form.location} onChangeText={(value) => set('location', value)} placeholder={t('cityHint')} />
            </Field>
          </Card>

          <Card>
            <SectionTitle>{t('documents')}</SectionTitle>
            <Text className="-mt-1 text-xs text-stone-500 dark:text-stone-400">{t('documentsHintBuyer')}</Text>
            <DocumentField label={t('profilePhoto')} hint={t('profilePhotoHint')} value={form.profilePhoto} onChange={setDocument('profilePhoto')} />
            <DocumentField label={t('aadhaar')} hint={t('aadhaarHint')} value={form.aadharCardPhoto} onChange={setDocument('aadharCardPhoto')} />
          </Card>

          <Button label={tActions('save')} icon="save-outline" accent="amber" loading={isSaving} onPress={save} />

          <ProfileSettings accent="amber" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
