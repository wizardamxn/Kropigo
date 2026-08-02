import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import { useTranslations } from 'use-intl';
import {
  useGetListingQuery,
  useGetMyInterestForListingQuery,
  useSubmitInterestMutation,
  useWithdrawInterestMutation,
} from '@/store/marketplaceApi';
import { useAppSelector } from '@/store/hooks';
import { PhotoCarousel } from '@/components/marketplace/PhotoCarousel';
import { MandiRateCard } from '@/components/listing/MandiRateCard';
import { rupees } from '@/lib/format';
import { BackLink, Badge, Button, Card, ErrorState, Field, Input, KeyValueRow, Loading, Screen, SectionTitle } from '@/components/ui';

export function ListingDetailView({ id, backLabel }: { id: string; backLabel: string }) {
  const t = useTranslations('mobile.listingDetail');
  const tMarket = useTranslations('mobile.marketplace');
  const tErrors = useTranslations('mobile.errors');
  const user = useAppSelector((state) => state.auth.user);
  const isBuyer = user?.role === 'buyer';

  const { data, isLoading, isError, refetch } = useGetListingQuery(id);
  // Anonymous visitors and kisans have no interest to fetch — the endpoint is buyer-only.
  const { data: interestData, isFetching: interestLoading } = useGetMyInterestForListingQuery(id, { skip: !isBuyer });

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !data?.data) {
    return <Screen><ErrorState message={tErrors('loadListing')} onRetry={refetch} /></Screen>;
  }

  const listing = data.data;
  const crop = typeof listing.cropId === 'string' ? 'Crop' : listing.cropId.name;
  const cropId = typeof listing.cropId === 'string' ? listing.cropId : listing.cropId._id;
  const seller = typeof listing.sellerId === 'string' ? undefined : listing.sellerId;
  const interest = interestData?.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <BackLink label={backLabel} />

        <PhotoCarousel urls={listing.mediaUrls} />

        <Card>
          <View className="flex-row justify-between gap-2">
            <Text className="flex-1 text-2xl font-extrabold text-stone-900 dark:text-stone-50">
              {crop}{listing.variety ? ` · ${listing.variety}` : ''}
            </Text>
            <Badge label={tMarket('grade', { grade: listing.grade })} className="bg-green-100 text-primary dark:bg-green-900 dark:text-green-400" />
          </View>
          <Text className="mt-2 text-base font-bold text-primary">
            {tMarket('available', { quantity: listing.quantity, unit: listing.unit })}
          </Text>
          <Text className="mt-3 leading-[21px] text-stone-500 dark:text-stone-400">
            {listing.description || t('noNotes')}
          </Text>
          {listing.viewCount !== undefined ? (
            <Text className="mt-3 text-xs text-stone-400 dark:text-stone-600">
              {listing.viewCount} view{listing.viewCount === 1 ? '' : 's'}
              {listing.interestCount ? ` · ${listing.interestCount} offer${listing.interestCount === 1 ? '' : 's'}` : ''}
            </Text>
          ) : null}
        </Card>

        <MandiRateCard cropId={cropId} />

        <Card>
          <SectionTitle>{t('farmerAndPickup')}</SectionTitle>
          <KeyValueRow label={t('farmer')} value={`${seller?.isVerified ? '✓ ' : ''}${seller?.name ?? 'KropiGo'}`} />
          {seller?.location ? <KeyValueRow label={t('basedIn')} value={seller.location} /> : null}
          <KeyValueRow label={t('pickup')} value={listing.farmAddress} />
          <KeyValueRow label={t('region')} value={`${listing.farmDistrict}, ${listing.farmState}`} />
        </Card>

        {!user ? (
          <SignInGate />
        ) : !isBuyer ? (
          <Card>
            <Text className="text-stone-500 dark:text-stone-400">{t('kisanNotice')}</Text>
          </Card>
        ) : interestLoading ? (
          <Loading />
        ) : (
          <InterestPanel listingId={id} unit={listing.unit} interest={interest} />
        )}
      </ScrollView>
    </Screen>
  );
}

/** Shown to anonymous visitors in place of the offer form. */
function SignInGate() {
  const t = useTranslations('mobile.listingDetail');
  return (
    <Card className="border-green-200 dark:border-green-900">
      <Text className="text-lg font-extrabold text-primary">{t('gateTitle')}</Text>
      <Text className="mt-1.5 text-stone-500 dark:text-stone-400">{t('gateBody')}</Text>
      <View className="mt-4 gap-2.5">
        <Button label={t('gateCreate')} icon="person-add-outline" onPress={() => router.push('/register')} />
        <Button label={t('gateHave')} variant="outline" onPress={() => router.push('/login')} />
      </View>
    </Card>
  );
}

/** Four states: no offer, pending (withdrawable), accepted, rejected/withdrawn (can re-offer). */
function InterestPanel({ listingId, unit, interest }: {
  listingId: string;
  unit: string;
  interest?: { _id: string; price: number; quantity?: number; status: string } | null;
}) {
  const t = useTranslations('mobile.offer');
  const tActions = useTranslations('mobile.actions');
  const [submitInterest, { isLoading: isSubmitting }] = useSubmitInterestMutation();
  const [withdrawInterest, { isLoading: isWithdrawing }] = useWithdrawInterestMutation();
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  if (interest?.status === 'pending') {
    const withdraw = () => {
      Alert.alert(t('withdrawTitle'), t('withdrawBody'), [
        { text: tActions('cancel'), style: 'cancel' },
        {
          text: t('withdraw'),
          style: 'destructive',
          // Failures surface through errorToastMiddleware.
          onPress: () => { void withdrawInterest({ listingId, interestId: interest._id }).unwrap().catch(() => undefined); },
        },
      ]);
    };

    return (
      <Card className="border-green-200 dark:border-green-900">
        <Text className="text-lg font-extrabold text-primary">{t('sent')}</Text>
        <Text className="mt-1 text-stone-500 dark:text-stone-400">
          {rupees(interest.price)} / {unit}{interest.quantity ? ` · ${interest.quantity} ${unit}` : ''}
        </Text>
        <View className="mt-4">
          <Button label={t('withdraw')} variant="danger" loading={isWithdrawing} onPress={withdraw} />
        </View>
      </Card>
    );
  }

  if (interest?.status === 'accepted') {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <Text className="text-lg font-extrabold text-primary">{t('accepted')}</Text>
        <Text className="mt-1 text-stone-500 dark:text-stone-400">{t('acceptedBody')}</Text>
        <View className="mt-4">
          <Button label={t('goToOrders')} accent="amber" icon="receipt-outline" onPress={() => router.push('/(buyer)/orders')} />
        </View>
      </Card>
    );
  }

  const send = async () => {
    const numericPrice = Number(price);
    const numericQuantity = quantity ? Number(quantity) : undefined;
    if (!numericPrice || numericPrice <= 0 || (numericQuantity !== undefined && numericQuantity <= 0)) {
      toast.error(t('invalidBody'));
      return;
    }
    try {
      await submitInterest({ listingId, price: numericPrice, quantity: numericQuantity, notes: notes.trim() || undefined }).unwrap();
      setPrice(''); setQuantity(''); setNotes('');
      toast.success(t('sent'));
    } catch {
      // errorToastMiddleware already surfaced the failure.
    }
  };

  return (
    <Card className="border-green-200 dark:border-green-900">
      <Text className="text-lg font-extrabold text-primary">{t('make')}</Text>
      {interest?.status === 'rejected' ? (
        <Text className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('rejectedRetry')}</Text>
      ) : null}

      <Field label={t('pricePer', { unit })}>
        <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="2400" />
      </Field>
      <Field label={t('quantityOptional')} hint={t('quantityHint')}>
        <Input value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder={unit} />
      </Field>
      <Field label={t('note')}>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t('notePlaceholder')}
          multiline
          className="h-20 pt-3"
          style={{ textAlignVertical: 'top' }}
        />
      </Field>

      <View className="mt-5">
        <Button label={t('send')} icon="paper-plane-outline" loading={isSubmitting} onPress={send} />
      </View>
    </Card>
  );
}
