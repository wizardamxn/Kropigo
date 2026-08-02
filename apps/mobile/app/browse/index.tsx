import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { MarketplaceList } from '@/components/marketplace/MarketplaceList';

/**
 * Public marketplace — reachable from the welcome screen without an account.
 * Making an offer is gated behind sign-in inside ListingDetailView.
 */
export default function PublicBrowse() {
  return (
    <MarketplaceList
      onOpenListing={(id) => router.push({ pathname: '/browse/[id]', params: { id } })}
      header={
        <Pressable onPress={() => router.replace('/welcome')} className="py-2 pl-3">
          <Text className="font-bold text-primary">Sign in</Text>
        </Pressable>
      }
    />
  );
}
