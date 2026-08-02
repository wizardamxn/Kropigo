import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
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
  fathersName: string;
  marka: string;
  location: string;
  profilePhoto: string;
  farmerIdPhoto: string;
  aadharCardPhoto: string;
  bankPassbookPhoto: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

const EMPTY: FormState = {
  name: '', fathersName: '', marka: '', location: '', profilePhoto: '', farmerIdPhoto: '',
  aadharCardPhoto: '', bankPassbookPhoto: '', accountNumber: '', ifscCode: '', bankName: '',
};

export default function KisanProfile() {
  const t = useTranslations('mobile.profile');
  const tActions = useTranslations('mobile.actions');
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [cleanupMedia] = useDeleteCloudinaryMediaMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  /** Old Cloudinary URLs are only purged after the profile saves successfully. */
  const [staleUrls, setStaleUrls] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string>();

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? '',
      fathersName: user.fathersName ?? '',
      marka: user.marka ?? '',
      location: user.location ?? '',
      profilePhoto: user.profilePhoto ?? '',
      farmerIdPhoto: user.farmerIdPhoto ?? '',
      aadharCardPhoto: user.aadharCardPhoto ?? '',
      bankPassbookPhoto: user.bankPassbookPhoto ?? '',
      accountNumber: user.bankDetails?.accountNumber ?? '',
      ifscCode: user.bankDetails?.ifscCode ?? '',
      bankName: user.bankDetails?.bankName ?? '',
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

    const bankDetails = {
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      bankName: form.bankName.trim(),
    };

    try {
      await updateProfile({
        name: form.name.trim(),
        role: user.role,
        location: form.location.trim(),
        fathersName: form.fathersName.trim() || undefined,
        marka: form.marka.trim().toUpperCase() || undefined,
        profilePhoto: form.profilePhoto,
        farmerIdPhoto: form.farmerIdPhoto,
        aadharCardPhoto: form.aadharCardPhoto,
        bankPassbookPhoto: form.bankPassbookPhoto,
        bankDetails,
      }).unwrap();

      dispatch(updateUser({
        name: form.name.trim(),
        location: form.location.trim(),
        fathersName: form.fathersName.trim(),
        marka: form.marka.trim().toUpperCase(),
        profilePhoto: form.profilePhoto,
        farmerIdPhoto: form.farmerIdPhoto,
        aadharCardPhoto: form.aadharCardPhoto,
        bankPassbookPhoto: form.bankPassbookPhoto,
        bankDetails,
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
      <PageHeader title={t('title')} subtitle={t('subtitleKisan')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <ProfileIdentity user={user} photoUrl={form.profilePhoto} accent="green" />

          <Card>
            <SectionTitle>{t('yourDetails')}</SectionTitle>
            <Field label={t('fullName')} error={nameError}>
              <Input value={form.name} onChangeText={(value) => set('name', value)} placeholder={t('fullNameHint')} />
            </Field>
            <Field label={t('fathersName')}>
              <Input value={form.fathersName} onChangeText={(value) => set('fathersName', value)} placeholder={t('fathersName')} />
            </Field>
            <Field label={t('marka')} hint={t('markaHint')}>
              <Input
                value={form.marka}
                onChangeText={(value) => set('marka', value.toUpperCase().slice(0, 5))}
                placeholder="RK12"
                autoCapitalize="characters"
                maxLength={5}
              />
            </Field>
            <Field label={t('village')}>
              <Input value={form.location} onChangeText={(value) => set('location', value)} placeholder={t('villageHint')} />
            </Field>
          </Card>

          <Card>
            <SectionTitle>{t('documents')}</SectionTitle>
            <Text className="-mt-1 text-xs text-stone-500 dark:text-stone-400">{t('documentsHintKisan')}</Text>
            <DocumentField label={t('profilePhoto')} hint={t('profilePhotoHint')} value={form.profilePhoto} onChange={setDocument('profilePhoto')} />
            <DocumentField label={t('farmerId')} hint={t('farmerIdHint')} value={form.farmerIdPhoto} onChange={setDocument('farmerIdPhoto')} />
            <DocumentField label={t('aadhaar')} value={form.aadharCardPhoto} onChange={setDocument('aadharCardPhoto')} />
            <DocumentField label={t('passbook')} hint={t('passbookHint')} value={form.bankPassbookPhoto} onChange={setDocument('bankPassbookPhoto')} />
          </Card>

          <Card>
            <SectionTitle>{t('bankDetails')}</SectionTitle>
            <Text className="-mt-1 text-xs text-stone-500 dark:text-stone-400">{t('bankHint')}</Text>
            <Field label={t('bankName')}>
              <Input value={form.bankName} onChangeText={(value) => set('bankName', value)} placeholder="State Bank of India" />
            </Field>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label={t('accountNumber')}>
                  <Input value={form.accountNumber} onChangeText={(value) => set('accountNumber', value)} keyboardType="number-pad" placeholder="—" />
                </Field>
              </View>
              <View className="flex-1">
                <Field label={t('ifsc')}>
                  <Input
                    value={form.ifscCode}
                    onChangeText={(value) => set('ifscCode', value.toUpperCase())}
                    autoCapitalize="characters"
                    placeholder="IFSC"
                  />
                </Field>
              </View>
            </View>
          </Card>

          <Button label={tActions('save')} icon="save-outline" loading={isSaving} onPress={save} />

          <ProfileSettings accent="green" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
